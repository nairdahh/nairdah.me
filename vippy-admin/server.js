const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const B2 = require('backblaze-b2');
const slugify = require('slugify');
const matter = require('gray-matter');
const yaml = require('js-yaml');

const app = express();
const PORT = 3001;

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const CONFIG_PATH = path.join(ROOT_DIR, '_config.yml');
const POSTS_DIR = path.join(ROOT_DIR, '_posts');
const PROJECTS_DIR = path.join(ROOT_DIR, '_projects');
const ABOUT_PATH = path.join(ROOT_DIR, 'pages', 'about.md');
const DATA_DIR = path.join(ROOT_DIR, '_data', 'virtual-photography');
const B2_CONFIG_PATH = path.join(__dirname, '.b2-config.json');
const SOCIAL_MEDIA_PATH = path.join(ROOT_DIR, '_data', 'social-media.yml');
const ALBUM_ORDER_PATH = path.join(DATA_DIR, '_album-order.json');
const VARIABLES_SCSS_PATH = path.join(ROOT_DIR, '_sass', '_variables.scss');

const CATPPUCCIN_PRESETS = {
    'Rosewater': { dark: '#f5e0dc', light: '#dc8a78' },
    'Flamingo': { dark: '#f2cdcd', light: '#dd7878' },
    'Pink': { dark: '#f5c2e7', light: '#ea76cb' },
    'Mauve': { dark: '#cba6f7', light: '#8839ef' },
    'Red': { dark: '#f38ba8', light: '#d20f39' },
    'Maroon': { dark: '#eba0ac', light: '#e64553' },
    'Peach': { dark: '#fab387', light: '#fe640b' },
    'Yellow': { dark: '#f9e2af', light: '#df8e1d' },
    'Green': { dark: '#a6e3a1', light: '#40a02b' },
    'Teal': { dark: '#94e2d5', light: '#179299' },
    'Sky': { dark: '#89dceb', light: '#04a5e5' },
    'Sapphire': { dark: '#74c7ec', light: '#209fb5' },
    'Blue': { dark: '#89b4fa', light: '#1e66f5' },
    'Lavender': { dark: '#b4befe', light: '#7287fd' }
};

// Helper: Get Theme Color
async function getThemeColor() {
    try {
        const content = await fs.readFile(VARIABLES_SCSS_PATH, 'utf8');
        const match = content.match(/\$primary:\s*(#[a-fA-F0-9]{3,6});/);
        return match ? match[1] : '#cba6f7';
    } catch (e) {
        console.error('Error reading theme color:', e);
        return '#cba6f7';
    }
}

// Helper: Update Theme Color
async function updateThemeColor(hexDark, hexLight) {
    try {
        let content = await fs.readFile(VARIABLES_SCSS_PATH, 'utf8');
        
        // Update $primary (Dark)
        content = content.replace(/\$primary:\s*#[a-fA-F0-9]{3,6};/, `$primary:   ${hexDark};`);
        
        // Update $primary-light (Light)
        content = content.replace(/\$primary-light:\s*#[a-fA-F0-9]{3,6};/, `$primary-light: ${hexLight};`);
        
        await fs.writeFile(VARIABLES_SCSS_PATH, content, 'utf8');
    } catch (e) {
        console.error('Error updating theme color:', e);
        throw e;
    }
}

// Load B2 config
let b2Config = {};
try {
    if (fsSync.existsSync(B2_CONFIG_PATH)) {
        b2Config = JSON.parse(fsSync.readFileSync(B2_CONFIG_PATH, 'utf8'));
    }
} catch (err) {
    console.error('Error loading .b2-config.json:', err.message);
}

// Global B2 state variables
let b2;
let b2AuthData = null;
let b2BucketId = null;
let b2AuthExpiry = 0;

function initializeB2() {
    if (b2Config.application_key_id && b2Config.application_key) {
        b2 = new B2({
            applicationKeyId: b2Config.application_key_id,
            applicationKey: b2Config.application_key
        });
        console.log('B2 initialized with config.');
    } else {
        b2 = null;
        console.log('B2 not initialized: Missing configuration.');
    }
    // Reset auth data when config changes
    b2AuthData = null;
    b2BucketId = null;
    b2AuthExpiry = 0;
}
initializeB2();

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global template variables
app.use((req, res, next) => {
    res.locals.isConfigured = !!(b2Config.application_key_id && b2Config.application_key && b2Config.bucket_name);
    next();
});

// Multer config for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
        }
    }
});

// Helper: Authorize B2
async function authorizeB2(forceRefresh = false) {
    if (!b2) {
        throw new Error('Backblaze B2 is not configured. Please go to Settings and provide your credentials.');
    }
    const now = Date.now();
    if (!b2AuthData || now > b2AuthExpiry || forceRefresh) {
        console.log('Authorizing B2...');
        b2AuthData = await b2.authorize();
        b2AuthExpiry = now + (23 * 60 * 60 * 1000); // 23 hours
        
        if (b2Config.bucket_id) {
            b2BucketId = b2Config.bucket_id;
            console.log('B2 authorized. Using bucket ID from config:', b2BucketId);
        } else {
            try {
                const buckets = await b2.listBuckets();
                const bucket = buckets.data.buckets.find(b => b.bucketName === b2Config.bucket_name);
                if (bucket) {
                    b2BucketId = bucket.bucketId;
                    console.log('B2 authorized. Bucket ID:', b2BucketId);
                } else {
                    throw new Error(`Bucket ${b2Config.bucket_name} not found`);
                }
            } catch (e) {
                console.error('Cannot list buckets. Please add "bucket_id" to .b2-config.json');
                throw new Error('bucket_id required in config when using limited app key');
            }
        }
    }
    return b2AuthData;
}

// Helper: Upload file to B2
async function uploadToB2(fileName, fileBuffer, contentType) {
    await authorizeB2();
    const uploadUrl = await b2.getUploadUrl({ bucketId: b2BucketId });
    
    const response = await b2.uploadFile({
        uploadUrl: uploadUrl.data.uploadUrl,
        uploadAuthToken: uploadUrl.data.authorizationToken,
        fileName: fileName,
        data: fileBuffer,
        contentType: contentType
    });
    
    return response.data;
}

// Helper: Delete file from B2
async function deleteFromB2(fileName) {
    await authorizeB2();
    
    const files = await b2.listFileVersions({
        bucketId: b2BucketId,
        prefix: fileName,
        maxFileCount: 1
    });
    
    if (files.data.files.length > 0) {
        const file = files.data.files[0];
        await b2.deleteFileVersion({
            fileId: file.fileId,
            fileName: file.fileName
        });
        return true;
    }
    return false;
}

// Helper: Get CDN URL
function getCdnUrl(filePath) {
    if (b2Config.use_cdn && b2Config.cdn_domain) {
        return `https://${b2Config.cdn_domain}/${filePath}`;
    }
    return `https://f003.backblazeb2.com/file/${b2Config.bucket_name}/${filePath}`;
}

// Helper: Read all albums (Now Async)
async function getAlbums() {
    try {
        const jsonFiles = (await fs.readdir(DATA_DIR)).filter(f => f.endsWith('.json') && !f.startsWith('_'));
        const postFilesList = (await fs.readdir(POSTS_DIR)).filter(f => f.endsWith('.md'));
        
        const albumPromises = jsonFiles.map(async (jsonFile) => {
            const slug = jsonFile.replace('.json', '');
            const jsonPath = path.join(DATA_DIR, jsonFile);
            const postFile = postFilesList.find(f => f.endsWith(`${slug}.md`));
            
            if (!postFile) return null;

            const postPath = path.join(POSTS_DIR, postFile);
            const postContent = await fs.readFile(postPath, 'utf8');
            const { data: frontMatter } = matter(postContent);
            
            let images = [];
            try {
                const rawImages = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
                images = rawImages.map(img => ({
                    url: img.url || img['imageFull-link'] || '',
                    thumb: img.thumb || img['thumbnail-link'] || '',
                    aspectRatio: parseFloat(img.aspectRatio || img['aspect-ratio'] || 1.5),
                    width: img.width || 0,
                    height: img.height || 0
                }));
            } catch (e) {
                console.error(`Error reading ${jsonFile}:`, e.message);
            }

            let tags = [];
            if (frontMatter.tags) {
                tags = Array.isArray(frontMatter.tags) ? frontMatter.tags : frontMatter.tags.split(',').map(t => t.trim());
            }

            return {
                slug,
                title: frontMatter.title || slug,
                description: frontMatter.description || 'Virtual Photography',
                developer: frontMatter.developer || '',
                date: frontMatter.date || '',
                tags,
                cardImage: parseInt(frontMatter['card-image']) || 0,
                cardOffset: parseInt(frontMatter['card-offset']) || 50,
                cardOffsetX: parseInt(frontMatter['card-offset-x']) || 50,
                cardZoom: parseInt(frontMatter['card-zoom']) || 100,
                bannerImage: parseInt(frontMatter['banner-image']) || 0,
                bannerOffset: parseInt(frontMatter['banner-offset']) || 50,
                bannerOffsetX: parseInt(frontMatter['banner-offset-x']) || 50,
                bannerZoom: parseInt(frontMatter['banner-zoom']) || 100,
                images,
                imageCount: images.length,
                postFile,
                jsonFile
            };
        });

        const albums = (await Promise.all(albumPromises)).filter(a => a !== null);
        const order = await getAlbumOrder();

        if (order.length > 0) {
            albums.sort((a, b) => {
                const aIndex = order.indexOf(a.slug);
                const bIndex = order.indexOf(b.slug);
                if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
                if (aIndex >= 0) return -1;
                if (bIndex >= 0) return 1;
                return new Date(b.date) - new Date(a.date);
            });
        } else {
            albums.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        return albums;
    } catch (err) {
        console.error('Error getting albums:', err);
        return [];
    }
}

// Helper: Get single album
async function getAlbum(slug) {
    const albums = await getAlbums();
    return albums.find(a => a.slug === slug);
}

// Helper: Create slug
function createSlug(name) {
    return slugify(name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g
    });
}

// Helper: Generate post markdown with gray-matter
function generatePostMarkdown(data) {
    const frontMatter = {
        layout: 'post',
        date: data.date || new Date().toISOString().split('T')[0],
        title: data.title || '',
        description: data.description || 'Virtual Photography',
        developer: data.developer || '',
        categories: ['virtual-photography'],
        tags: data.tags || [],
        slug: data.slug,
        'card-image': data.cardImage || 0,
        'card-offset': data.cardOffset || 50,
        'card-offset-x': data.cardOffsetX || 50,
        'card-zoom': data.cardZoom || 100,
        'banner-image': data.bannerImage || 0,
        'banner-offset': data.bannerOffset || 50,
        'banner-offset-x': data.bannerOffsetX || 50,
        'banner-zoom': data.bannerZoom || 100
    };
    return matter.stringify('', frontMatter);
}

// Helper: Get album order
async function getAlbumOrder() {
    try {
        const exists = await fs.access(ALBUM_ORDER_PATH).then(() => true).catch(() => false);
        if (exists) {
            const content = await fs.readFile(ALBUM_ORDER_PATH, 'utf8');
            const order = JSON.parse(content);
            return order.filter(slug => slug !== null);
        }
    } catch (e) {
        console.error('Error reading album order:', e.message);
    }
    return [];
}

// Helper: Save album order
async function saveAlbumOrder(order) {
    await fs.writeFile(ALBUM_ORDER_PATH, JSON.stringify(order, null, 2));
}

// Helper: Get modules from config
async function getModules() {
    try {
        const file = await fs.readFile(CONFIG_PATH, 'utf8');
        const config = yaml.load(file);
        return config.site_modules || [];
    } catch (e) {
        console.error('Error reading modules:', e);
        return [];
    }
}

// Helper: Save modules to config
async function saveModules(modules) {
    try {
        const file = await fs.readFile(CONFIG_PATH, 'utf8');
        let config = yaml.load(file);
        config.site_modules = modules;
        const newYaml = yaml.dump(config);
        await fs.writeFile(CONFIG_PATH, newYaml, 'utf8');
    } catch (e) {
        console.error('Error saving modules:', e);
        throw e;
    }
}

// Routes

app.get('/', async (req, res) => {
    res.redirect('/vippy');
});

app.get('/vippy', async (req, res) => {
    const modules = await getModules();
    res.render('index', { modules });
});

// Site Settings Route
app.get('/vippy/settings', async (req, res) => {
    try {
        const configContent = await fs.readFile(CONFIG_PATH, 'utf8');
        const config = yaml.load(configContent);
        
        let socialMedia = {};
        try {
            const socialContent = await fs.readFile(SOCIAL_MEDIA_PATH, 'utf8');
            socialMedia = yaml.load(socialContent);
        } catch (e) {
            console.error('Error reading social media:', e);
        }

        const currentThemeColor = await getThemeColor();
        res.render('site-settings', { config, socialMedia, currentThemeColor, presets: CATPPUCCIN_PRESETS });
    } catch (err) {
        console.error('Error loading settings:', err);
        res.status(500).send('Error loading settings');
    }
});

app.post('/vippy/settings', upload.single('favicon'), async (req, res) => {
    try {
        const logData = [];
        logData.push('--- Request ' + new Date().toISOString() + ' ---');
        logData.push('Body keys: ' + Object.keys(req.body).join(', '));
        logData.push('Body: ' + JSON.stringify(req.body, null, 2));

        console.log('Received settings update request');
        
        const configContent = await fs.readFile(CONFIG_PATH, 'utf8');
        let config = yaml.load(configContent);
        
        // Ensure config exists
        if (!config) config = {};
        
        // Update general settings
        config.title = req.body.title;
        config.description = req.body.description;
        config.url = req.body.url;
        config.keywords = req.body.keywords;
        
        // Ensure author object exists
        if (!config.author) config.author = {};

        config.author = {
            ...config.author,
            name: req.body.author_name
            // email removed as per request
        };

        // Handle Theme Color
        if (req.body.theme_color_mode === 'preset') {
            const presetName = req.body.theme_color_preset;
            if (presetName && CATPPUCCIN_PRESETS[presetName]) {
                logData.push(`Setting theme preset: ${presetName}`);
                await updateThemeColor(CATPPUCCIN_PRESETS[presetName].dark, CATPPUCCIN_PRESETS[presetName].light);
            }
        } else if (req.body.theme_color_mode === 'custom') {
            const customColor = req.body.theme_color_custom;
            if (customColor) {
                logData.push(`Setting custom theme color: ${customColor}`);
                // For custom, we use the same color for both or we could calculate a variant.
                // Using the same color for now as per "custom color" request which implies a single pick.
                // Or maybe we should just darken it slightly for light mode? 
                // Let's use the same color for simplicity and predictability unless we have a darkening function.
                await updateThemeColor(customColor, customColor);
            }
        }

        // Analytics Settings
        if (!config.analytics) config.analytics = { google: {} };
        if (!config.analytics.google) config.analytics.google = {};
        
        config.analytics.enabled = req.body.analytics_enabled === 'on';
        config.analytics.google.tracking_id = req.body.analytics_id;
        
        // Handle favicon upload
        if (req.file) {
            console.log('File uploaded:', req.file.path);
            const faviconPath = path.join(ROOT_DIR, 'assets', 'favicon.ico');
            await fs.copyFile(req.file.path, faviconPath);
            await fs.unlink(req.file.path); // cleanup temp
        }

        // Handle Social Media (Usernames)
        logData.push('Updating social media...');
        for (const [key, value] of Object.entries(req.body)) {
            if (key.startsWith('social_')) {
                const socialKey = key.replace('social_', '');
                if (value && value.trim() !== '') {
                    logData.push(`Setting social ${socialKey}: ${value}`);
                    config.author[socialKey] = value.trim();
                } else {
                    // Remove if empty
                    logData.push(`Removing social ${socialKey}`);
                    delete config.author[socialKey];
                }
            }
        }

        // Save _config.yml
        logData.push('Saving config to: ' + CONFIG_PATH);
        const yamlStr = yaml.dump(config);
        logData.push('New YAML content (preview): ' + yamlStr.substring(0, 200) + '...');
        
        await fs.writeFile(CONFIG_PATH, yamlStr, 'utf8');
        logData.push('Config saved successfully');
        
        // Write log to file
        await fs.appendFile(path.join(ROOT_DIR, 'debug_log.txt'), logData.join('\n') + '\n\n');

        res.redirect('/vippy/settings');
    } catch (err) {
        console.error('Error saving settings:', err);
        await fs.appendFile(path.join(ROOT_DIR, 'debug_log.txt'), 'Error: ' + err.message + '\n' + err.stack + '\n\n');
        res.status(500).send('Error saving settings: ' + err.message);
    }
});


app.post('/api/modules/reorder', async (req, res) => {
    try {
        const { modules: newStates } = req.body;
        const currentModules = await getModules();
        
        // Reorder and update status based on input
        const updatedModules = [];
        
        // First add modules in the new order
        newStates.forEach(state => {
            const mod = currentModules.find(m => m.id === state.id);
            if (mod) {
                mod.enabled = state.enabled;
                updatedModules.push(mod);
            }
        });
        
        // Add any missing modules (safety check)
        currentModules.forEach(mod => {
            if (!updatedModules.find(m => m.id === mod.id)) {
                updatedModules.push(mod);
            }
        });

        await saveModules(updatedModules);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Helper: Get blog posts
async function getBlogPosts() {
    try {
        const files = await fs.readdir(POSTS_DIR);
        const mdFiles = files.filter(f => f.endsWith('.md'));
        
        const posts = await Promise.all(mdFiles.map(async (file) => {
            const content = await fs.readFile(path.join(POSTS_DIR, file), 'utf8');
            const { data, content: body } = matter(content);
            
            // Skip if it's a VP post
            const categories = Array.isArray(data.categories) ? data.categories : (data.categories || '').toString().split(',').map(c => c.trim());
            if (categories.includes('virtual-photography')) return null;

            return {
                filename: file,
                // Extract date and slug from filename: YYYY-MM-DD-slug.md
                fileSlug: file.replace('.md', ''),
                title: data.title || 'Untitled',
                date: data.date,
                author: data.author,
                categories: categories,
                tags: data.tags,
                image: data.image,
                excerpt: data.excerpt,
                content: body
            };
        }));
        
        return posts.filter(p => p !== null).sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
        console.error('Error getting blog posts:', e);
        return [];
    }
}

// Blog Routes
app.get('/vippy/blog', async (req, res) => {
    const posts = await getBlogPosts();
    res.render('blog-dashboard', { posts });
});

app.get('/vippy/blog/new', (req, res) => {
    res.render('edit-post', { post: null });
});

app.get('/vippy/blog/edit/:fileSlug', async (req, res) => {
    const posts = await getBlogPosts();
    const post = posts.find(p => p.fileSlug === req.params.fileSlug);
    if (!post) return res.status(404).send('Post not found');
    res.render('edit-post', { post });
});

app.post('/vippy/blog/save', upload.single('headerImage'), async (req, res) => {
    try {
        const { title, date, author, categories, tags, excerpt, content, imageUrl, originalFilename } = req.body;
        
        let finalImageUrl = imageUrl;
        if (req.file) {
            // Upload to B2
            const ext = path.extname(req.file.originalname);
            const fileName = `blog/${Date.now()}${ext}`;
            await uploadToB2(fileName, req.file.buffer, req.file.mimetype);
            finalImageUrl = getCdnUrl(fileName);
        }

        const slug = createSlug(title);
        const actualDate = date || new Date().toISOString().split('T')[0];
        const newFilename = `${actualDate}-${slug}.md`;
        
        const frontMatter = {
            layout: 'post',
            title,
            date: actualDate,
            author,
            categories: categories ? categories.split(',').map(c => c.trim()) : ['blog'],
            tags: tags ? tags.split(',').map(t => t.trim()) : [],
            image: finalImageUrl,
            excerpt
        };

        const fileContent = matter.stringify(content || '', frontMatter);
        
        // If editing and filename changed (date or title changed), delete old file
        if (originalFilename && originalFilename !== newFilename) {
            const oldPath = path.join(POSTS_DIR, originalFilename + '.md');
            await fs.access(oldPath).then(() => fs.unlink(oldPath)).catch(() => {});
        }

        await fs.writeFile(path.join(POSTS_DIR, newFilename), fileContent);
        
        res.redirect('/vippy/blog');
    } catch (e) {
        console.error('Error saving blog post:', e);
        res.status(500).send(e.message);
    }
});

app.post('/vippy/blog/delete/:fileSlug', async (req, res) => {
    try {
        const filePath = path.join(POSTS_DIR, req.params.fileSlug + '.md');
        await fs.unlink(filePath);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Helper: Get projects
async function getProjects() {
    try {
        const files = await fs.readdir(PROJECTS_DIR);
        const mdFiles = files.filter(f => f.endsWith('.md'));
        
        const projects = await Promise.all(mdFiles.map(async (file) => {
            const content = await fs.readFile(path.join(PROJECTS_DIR, file), 'utf8');
            const { data, content: body } = matter(content);
            
            return {
                filename: file,
                fileSlug: file.replace('.md', ''),
                name: data.name || 'Untitled',
                tools: data.tools || [],
                image: data.image,
                description: data.description,
                external_url: data.external_url,
                content: body
            };
        }));
        
        return projects.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));
    } catch (e) {
        console.error('Error getting projects:', e);
        return [];
    }
}

// Project Routes
app.get('/vippy/projects', async (req, res) => {
    const projects = await getProjects();
    res.render('projects-dashboard', { projects });
});

app.get('/vippy/projects/new', (req, res) => {
    res.render('edit-project', { project: null });
});

app.get('/vippy/projects/edit/:fileSlug', async (req, res) => {
    const projects = await getProjects();
    const project = projects.find(p => p.fileSlug === req.params.fileSlug);
    if (!project) return res.status(404).send('Project not found');
    res.render('edit-project', { project });
});

app.post('/vippy/projects/save', upload.single('projectImage'), async (req, res) => {
    try {
        const { name, tools, description, external_url, content, imageUrl, originalFilename } = req.body;
        
        let finalImageUrl = imageUrl;
        if (req.file) {
            const ext = path.extname(req.file.originalname);
            const fileName = `projects/${Date.now()}${ext}`;
            await uploadToB2(fileName, req.file.buffer, req.file.mimetype);
            finalImageUrl = getCdnUrl(fileName);
        }
        
        let newFilename = originalFilename;
        if (!newFilename) {
            newFilename = createSlug(name);
        }
        
        const frontMatter = {
            name,
            tools: tools ? tools.split(',').map(t => t.trim()) : [],
            image: finalImageUrl,
            description,
            external_url: external_url || undefined
        };

        const fileContent = matter.stringify(content || '', frontMatter);
        
        const filePath = path.join(PROJECTS_DIR, newFilename + '.md');
        await fs.writeFile(filePath, fileContent);
        
        res.redirect('/vippy/projects');
    } catch (e) {
        console.error('Error saving project:', e);
        res.status(500).send(e.message);
    }
});

app.post('/vippy/projects/delete/:fileSlug', async (req, res) => {
    try {
        const filePath = path.join(PROJECTS_DIR, req.params.fileSlug + '.md');
        await fs.unlink(filePath);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// About Routes
app.get('/vippy/about', async (req, res) => {
    try {
        const content = await fs.readFile(ABOUT_PATH, 'utf8');
        const { data, content: body } = matter(content);
        res.render('edit-about', { 
            content: body, 
            frontMatter: data,
            success: req.query.success === 'true'
        });
    } catch (e) {
        console.error('Error reading about page:', e);
        res.status(500).send(e.message);
    }
});

app.post('/vippy/about/save', async (req, res) => {
    try {
        const { content, title, layout, permalink, weight } = req.body;
        
        const frontMatter = {
            layout: layout || 'about',
            title: title || 'About',
            permalink: permalink || '/about/',
            weight: weight ? parseInt(weight) : 2
        };

        const fileContent = matter.stringify(content || '', frontMatter);
        await fs.writeFile(ABOUT_PATH, fileContent);
        
        res.redirect('/vippy/about?success=true');
    } catch (e) {
        console.error('Error saving about page:', e);
        res.status(500).send(e.message);
    }
});

app.get('/vippy/vp', async (req, res) => {
    const albums = await getAlbums();
    const hasB2Config = b2Config && b2Config.application_key_id && b2Config.application_key && b2Config.bucket_id;
    res.render('vp-dashboard', { albums, hasB2Config });
});

app.get('/vippy/vp/new', (req, res) => {
    const hasB2Config = b2Config && b2Config.application_key_id && b2Config.application_key && b2Config.bucket_id;
    if (!hasB2Config) return res.redirect('/vippy/vp');
    res.render('new-album');
});

app.post('/vippy/vp/create', upload.array('images', 100), async (req, res) => {
    try {
        const { title, developer, description, date } = req.body;
        const slug = createSlug(title);
        const actualDate = date || new Date().toISOString().split('T')[0];
        
        const jsonPath = path.join(DATA_DIR, `${slug}.json`);
        const exists = await fs.access(jsonPath).then(() => true).catch(() => false);
        if (exists) {
            return res.status(400).json({ error: 'Album with this name already exists' });
        }
        
        const images = [];
        const files = req.files || [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const imgNum = String(i).padStart(3, '0');
            const metadata = await sharp(file.buffer).metadata();
            const aspectRatio = Math.round((metadata.width / metadata.height) * 10000) / 10000;
            
            const originalFileName = `${slug}/img${imgNum}.jpg`;
            let originalBuffer = file.buffer;
            
            if (file.mimetype !== 'image/jpeg') {
                originalBuffer = await sharp(file.buffer).jpeg({ quality: 95 }).toBuffer();
            }
            await uploadToB2(originalFileName, originalBuffer, 'image/jpeg');
            
            const thumbBuffer = await sharp(file.buffer)
                .resize(600, null, { withoutEnlargement: true })
                .webp({ quality: 85 })
                .toBuffer();
            
            const thumbFileName = `${slug}/thumb/img${imgNum}.webp`;
            await uploadToB2(thumbFileName, thumbBuffer, 'image/webp');
            
            images.push({
                url: getCdnUrl(originalFileName),
                thumb: getCdnUrl(thumbFileName),
                aspectRatio,
                width: metadata.width,
                height: metadata.height
            });
        }
        
        await fs.writeFile(jsonPath, JSON.stringify(images, null, 2));
        
        const postFileName = `${actualDate}-${slug}.md`;
        const postPath = path.join(POSTS_DIR, postFileName);
        const postContent = generatePostMarkdown({
            title, developer, description, date: actualDate, slug
        });
        await fs.writeFile(postPath, postContent);
        
        res.json({ success: true, slug, message: `Album "${title}" created with ${images.length} images` });
    } catch (err) {
        console.error('Error creating album:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/vippy/vp/edit/:slug', async (req, res) => {
    const album = await getAlbum(req.params.slug);
    if (!album) return res.status(404).send('Album not found');
    res.render('edit-album', { album });
});

app.post('/vippy/vp/update/:slug', async (req, res) => {
    try {
        const album = await getAlbum(req.params.slug);
        if (!album) return res.status(404).json({ error: 'Album not found' });
        
        const { title, description, developer, date, tags, cardImage, cardOffset, cardOffsetX, cardZoom, bannerImage, bannerOffset, bannerOffsetX, bannerZoom } = req.body;
        
        let parsedTags = album.tags;
        if (tags !== undefined) {
            parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(t => t) : tags;
        }
        
        const newDate = date || album.date;
        const oldPostPath = path.join(POSTS_DIR, album.postFile);
        let newPostPath = oldPostPath;
        
        if (date && date !== album.date) {
            const newFileName = `${date}-${album.slug}.md`;
            newPostPath = path.join(POSTS_DIR, newFileName);
            const exists = await fs.access(oldPostPath).then(() => true).catch(() => false);
            if (exists) await fs.rename(oldPostPath, newPostPath);
        }
        
        const postContent = generatePostMarkdown({
            title: title || album.title,
            description: description !== undefined ? description : album.description,
            developer: developer !== undefined ? developer : album.developer,
            date: newDate,
            tags: parsedTags,
            slug: album.slug,
            cardImage: cardImage !== undefined ? parseInt(cardImage) : album.cardImage,
            cardOffset: cardOffset !== undefined ? parseInt(cardOffset) : album.cardOffset,
            cardOffsetX: cardOffsetX !== undefined ? parseInt(cardOffsetX) : album.cardOffsetX,
            cardZoom: cardZoom !== undefined ? parseInt(cardZoom) : album.cardZoom,
            bannerImage: bannerImage !== undefined ? parseInt(bannerImage) : album.bannerImage,
            bannerOffset: bannerOffset !== undefined ? parseInt(bannerOffset) : album.bannerOffset,
            bannerOffsetX: bannerOffsetX !== undefined ? parseInt(bannerOffsetX) : album.bannerOffsetX,
            bannerZoom: bannerZoom !== undefined ? parseInt(bannerZoom) : album.bannerZoom
        });
        
        await fs.writeFile(newPostPath, postContent);
        res.json({ success: true, message: 'Album updated' });
    } catch (err) {
        console.error('Error updating album:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/vippy/vp/add-images/:slug', upload.array('images', 100), async (req, res) => {
    try {
        const album = await getAlbum(req.params.slug);
        if (!album) return res.status(404).json({ error: 'Album not found' });
        
        const jsonPath = path.join(DATA_DIR, album.jsonFile);
        const images = [...album.images];
        const files = req.files || [];
        let nextNum = images.length;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const imgNum = String(nextNum + i).padStart(3, '0');
            const metadata = await sharp(file.buffer).metadata();
            const aspectRatio = Math.round((metadata.width / metadata.height) * 10000) / 10000;
            
            const originalFileName = `${album.slug}/img${imgNum}.jpg`;
            let originalBuffer = file.buffer;
            if (file.mimetype !== 'image/jpeg') {
                originalBuffer = await sharp(file.buffer).jpeg({ quality: 95 }).toBuffer();
            }
            await uploadToB2(originalFileName, originalBuffer, 'image/jpeg');
            
            const thumbBuffer = await sharp(file.buffer)
                .resize(600, null, { withoutEnlargement: true })
                .webp({ quality: 85 })
                .toBuffer();
            const thumbFileName = `${album.slug}/thumb/img${imgNum}.webp`;
            await uploadToB2(thumbFileName, thumbBuffer, 'image/webp');
            
            images.push({
                url: getCdnUrl(originalFileName),
                thumb: getCdnUrl(thumbFileName),
                aspectRatio,
                width: metadata.width,
                height: metadata.height
            });
        }
        
        await fs.writeFile(jsonPath, JSON.stringify(images, null, 2));
        res.json({ success: true, message: `Added ${files.length} images`, totalImages: images.length });
    } catch (err) {
        console.error('Error adding images:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/vippy/vp/delete-image/:slug/:index', async (req, res) => {
    try {
        const album = await getAlbum(req.params.slug);
        if (!album) return res.status(404).json({ error: 'Album not found' });
        
        const index = parseInt(req.params.index);
        if (index < 0 || index >= album.images.length) return res.status(400).json({ error: 'Invalid image index' });
        
        const image = album.images[index];
        const urlPath = new URL(image.url).pathname;
        const thumbPath = new URL(image.thumb).pathname;
        const originalFile = urlPath.split('/').slice(-2).join('/');
        const thumbFile = thumbPath.split('/').slice(-3).join('/');
        
        try {
            await deleteFromB2(originalFile);
            await deleteFromB2(thumbFile);
        } catch (e) {
            console.error('Error deleting from B2:', e.message);
        }
        
        const images = album.images.filter((_, i) => i !== index);
        await fs.writeFile(path.join(DATA_DIR, album.jsonFile), JSON.stringify(images, null, 2));
        res.json({ success: true, message: 'Image deleted' });
    } catch (err) {
        console.error('Error deleting image:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/vippy/vp/delete/:slug', async (req, res) => {
    try {
        const album = await getAlbum(req.params.slug);
        if (!album) return res.status(404).json({ error: 'Album not found' });
        
        for (const image of album.images) {
            try {
                const urlPath = new URL(image.url).pathname;
                const thumbPath = new URL(image.thumb).pathname;
                const originalFile = urlPath.split('/').slice(-2).join('/');
                const thumbFile = thumbPath.split('/').slice(-3).join('/');
                await deleteFromB2(originalFile);
                await deleteFromB2(thumbFile);
            } catch (e) {
                console.error('Error deleting file from B2:', e.message);
            }
        }
        
        const postPath = path.join(POSTS_DIR, album.postFile);
        const jsonPath = path.join(DATA_DIR, album.jsonFile);
        await fs.access(postPath).then(() => fs.unlink(postPath)).catch(() => {});
        await fs.access(jsonPath).then(() => fs.unlink(jsonPath)).catch(() => {});
        
        res.json({ success: true, message: 'Album deleted' });
    } catch (err) {
        console.error('Error deleting album:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/vippy/vp/order', async (req, res) => {
    const albums = await getAlbums();
    res.render('album-order', { albums });
});

app.post('/vippy/vp/reorder', async (req, res) => {
    try {
        const { order } = req.body;
        await saveAlbumOrder(order);
        res.json({ success: true });
    } catch (err) {
        console.error('Error saving order:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/vippy/vp/reorder-images/:slug', async (req, res) => {
    try {
        const album = await getAlbum(req.params.slug);
        if (!album) return res.status(404).json({ error: 'Album not found' });
        
        const { order } = req.body;
        if (!Array.isArray(order)) return res.status(400).json({ error: 'Invalid order array' });
        
        const newImages = order.map(i => album.images[i]);
        await fs.writeFile(path.join(DATA_DIR, album.jsonFile), JSON.stringify(newImages, null, 2));
        res.json({ success: true, message: 'Images reordered' });
    } catch (err) {
        console.error('Error reordering images:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/vippy/order', async (req, res) => {
    const albums = await getAlbums();
    const order = await getAlbumOrder();
    const orderedAlbums = [];
    const unorderedAlbums = [];
    
    albums.forEach(album => {
        const orderIndex = order.indexOf(album.slug);
        if (orderIndex >= 0) orderedAlbums[orderIndex] = album;
        else unorderedAlbums.push(album);
    });
    
    const sortedAlbums = orderedAlbums.filter(a => a).concat(unorderedAlbums);
    res.render('album-order', { albums: sortedAlbums, order });
});

app.post('/vippy/save-order', async (req, res) => {
    try {
        const { order } = req.body;
        if (!Array.isArray(order)) return res.status(400).json({ error: 'Invalid order array' });
        await saveAlbumOrder(order);
        res.json({ success: true, message: 'Album order saved' });
    } catch (err) {
        console.error('Error saving album order:', err);
        res.status(500).json({ error: err.message });
    }
});

// Settings Endpoints
app.get('/settings/config', (req, res) => {
    res.json(b2Config);
});

app.post('/settings/config', async (req, res) => {
    try {
        const newConfig = {
            application_key_id: req.body.application_key_id,
            application_key: req.body.application_key,
            bucket_name: req.body.bucket_name,
            bucket_id: req.body.bucket_id,
            use_cdn: req.body.use_cdn === true || req.body.use_cdn === 'true',
            cdn_domain: req.body.cdn_domain || ''
        };
        
        await fs.writeFile(B2_CONFIG_PATH, JSON.stringify(newConfig, null, 2));
        b2Config = newConfig;
        initializeB2();
        
        res.json({ success: true, message: 'Configuration saved and applied' });
    } catch (err) {
        console.error('Error saving B2 config:', err);
        res.status(500).json({ error: err.message });
    }
});

// Site Config Endpoints (YAML)
const LANDING_DATA_PATH = path.join(ROOT_DIR, '_data', 'landing.json');

app.get('/vippy/landing', async (req, res) => {
    try {
        let data = {};
        try {
            const fileContent = await fs.readFile(LANDING_DATA_PATH, 'utf8');
            data = JSON.parse(fileContent);
        } catch (e) {
            // If file doesn't exist or is empty, use defaults
            data = { title: '', subtitle: '', text: '', buttons: [] };
        }
        res.render('landing-dashboard', { data });
    } catch (err) {
        console.error('Error loading landing page data:', err);
        res.status(500).send('Error loading landing page data');
    }
});

app.post('/vippy/landing/save', async (req, res) => {
    try {
        const { title, subtitle, text, buttons } = req.body;
        
        let buttonsArray = [];
        if (buttons) {
            if (Array.isArray(buttons)) {
                buttonsArray = buttons;
            } else if (typeof buttons === 'object') {
                buttonsArray = Object.values(buttons);
            }
        }

        const data = {
            title: title || '',
            subtitle: subtitle || '',
            text: text || '',
            buttons: buttonsArray
        };

        await fs.writeFile(LANDING_DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
        res.redirect('/vippy/landing');
    } catch (err) {
        console.error('Error saving landing page data:', err);
        res.status(500).send('Error saving landing page data');
    }
});
app.get('/settings/site-config', async (req, res) => {
    try {
        const fileContent = await fs.readFile(CONFIG_PATH, 'utf8');
        const config = yaml.load(fileContent);
        res.json(config);
    } catch (err) {
        console.error('Error reading _config.yml:', err);
        res.status(500).json({ error: 'Failed to read site config' });
    }
});

app.post('/settings/site-config', async (req, res) => {
    try {
        // Read current config to preserve comments/structure if possible, 
        // but js-yaml dump will rewrite it. For a simple admin, full rewrite is acceptable.
        // Ideally we would update only specific fields, but YAML parsers usually load/dump the whole object.
        
        const currentContent = await fs.readFile(CONFIG_PATH, 'utf8');
        let currentConfig = yaml.load(currentContent);
        
        // Merge incoming data
        // We expect req.body to have keys like 'title', 'description', 'author', etc.
        const { title, description, url, author_name, author_email, author_github, author_twitter, author_bluesky, vp_show_date, vp_show_tags } = req.body;
        
        if (title) currentConfig.title = title;
        if (description) currentConfig.description = description;
        if (url) currentConfig.url = url;
        
        // Update Author info safely
        if (!currentConfig.author) currentConfig.author = {};
        if (author_name) currentConfig.author.name = author_name;
        if (author_email) currentConfig.author.email = author_email;
        if (author_github !== undefined) currentConfig.author.github = author_github;
        if (author_twitter !== undefined) currentConfig.author.twitter = author_twitter;
        if (author_bluesky !== undefined) currentConfig.author.bluesky = author_bluesky;

        // Update Virtual Photography Settings
        if (!currentConfig.virtual_photography) currentConfig.virtual_photography = {};
        // Checkboxes often send 'on' or nothing, or true/false if JSON. 
        // We will handle boolean values if sent as JSON or string 'true'/'false'/'on'
        if (vp_show_date !== undefined) currentConfig.virtual_photography.show_date = (vp_show_date === true || vp_show_date === 'true' || vp_show_date === 'on');
        if (vp_show_tags !== undefined) currentConfig.virtual_photography.show_tags = (vp_show_tags === true || vp_show_tags === 'true' || vp_show_tags === 'on');

        const newYaml = yaml.dump(currentConfig);
        await fs.writeFile(CONFIG_PATH, newYaml, 'utf8');
        
        res.json({ success: true, message: 'Site configuration updated!' });
    } catch (err) {
        console.error('Error writing _config.yml:', err);
        res.status(500).json({ error: 'Failed to update site config' });
    }
});

app.listen(PORT, () => {
    console.log(`\n🎮 Virtual Photography Admin Panel`);
    console.log(`   Running at: http://localhost:${PORT}/vippy`);
    console.log(`   B2 Bucket: ${b2Config.bucket_name}`);
    console.log(`   CDN: ${b2Config.cdn_domain || 'Not configured'}\n`);
});
