// Blog Card Interactions
(function() {
  'use strict';

  // Handle Card Click
  window.handleCardClick = function(event, postUrl) {
    // Don't trigger if clicking on interactive elements
    if (event.target.closest('button') || event.target.closest('a')) {
      return;
    }

    // Don't trigger if text is selected
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      return;
    }

    // Navigate to post
    window.location.href = postUrl;
  };

  // Share Post Function
  window.sharePost = function(event, postUrl, postTitle) {
    event.preventDefault();
    event.stopPropagation();

    const fullUrl = window.location.origin + postUrl;

    // Check if Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: postTitle,
        url: fullUrl
      }).catch(err => {
        console.log('Share cancelled or failed:', err);
      });
    } else {
      // Fallback: Copy to clipboard
      copyToClipboard(fullUrl);
      showToast('Link copied to clipboard!');
    }
  };

  // Toggle Menu Function
  window.toggleMenu = function(event) {
    event.preventDefault();
    event.stopPropagation();

    const menuWrapper = event.currentTarget.closest('.menu-wrapper');
    const cardItem = menuWrapper.closest('.blog-post-item');
    const wasActive = menuWrapper.classList.contains('active');

    // Close all other menus first
    document.querySelectorAll('.menu-wrapper.active').forEach(menu => {
      menu.classList.remove('active');
      // Remove z-index boost from other cards
      const item = menu.closest('.blog-post-item');
      if (item) item.classList.remove('active-card');
    });

    // Toggle current menu
    if (!wasActive) {
      menuWrapper.classList.add('active');
      if (cardItem) cardItem.classList.add('active-card');
      console.log('Menu opened');
    } else {
      console.log('Menu closed');
    }
  };

  // Copy Link Function
  window.copyLink = function(event, postUrl) {
    event.preventDefault();
    event.stopPropagation();

    const fullUrl = window.location.origin + postUrl;
    copyToClipboard(fullUrl);
    showToast('Link copied to clipboard!');
    closeAllMenus();
  };

  // Open in New Tab Function
  window.openInNewTab = function(event, postUrl) {
    event.preventDefault();
    event.stopPropagation();
    
    const fullUrl = window.location.origin + postUrl;
    window.open(fullUrl, '_blank');
    closeAllMenus();
  };

  // Share on X Function
  window.shareOnX = function(event, postUrl, postTitle) {
    event.preventDefault();
    event.stopPropagation();

    const fullUrl = window.location.origin + postUrl;
    const text = `Check out "${postTitle}" by @nairdah28`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fullUrl)}`;
    
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    closeAllMenus();
  };

  // Copy Markdown Function
  window.copyMarkdown = function(event, postUrl, postTitle) {
    event.preventDefault();
    event.stopPropagation();

    const fullUrl = window.location.origin + postUrl;
    const markdown = `[${postTitle}](${fullUrl})`;
    
    copyToClipboard(markdown);
    showToast('Markdown link copied!');
    closeAllMenus();
  };

  // Share on LinkedIn Function
  window.shareOnLinkedIn = function(event, postUrl, postTitle) {
    event.preventDefault();
    event.stopPropagation();

    const fullUrl = window.location.origin + postUrl;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`;
    
    window.open(linkedinUrl, '_blank', 'width=550,height=520');
    closeAllMenus();
  };

  // Share on Reddit Function
  window.shareOnReddit = function(event, postUrl, postTitle) {
    event.preventDefault();
    event.stopPropagation();

    const fullUrl = window.location.origin + postUrl;
    const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(postTitle)}`;
    
    window.open(redditUrl, '_blank', 'width=550,height=520');
    closeAllMenus();
  };

  // Helper: Copy to clipboard
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  // Helper: Show toast notification
  function showToast(message) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.blog-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create new toast
    const toast = document.createElement('div');
    toast.className = 'blog-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Helper: Close all menus
  function closeAllMenus() {
    document.querySelectorAll('.menu-wrapper.active').forEach(menu => {
      menu.classList.remove('active');
    });
  }

  // Close menus when clicking outside
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.menu-wrapper')) {
      closeAllMenus();
    }
  });

  // Close menus on Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeAllMenus();
    }
  });

  // Add toast styles if not already present
  if (!document.getElementById('blog-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'blog-toast-styles';
    style.textContent = `
      .blog-toast {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: var(--overlay-bg, rgba(0, 0, 0, 0.9));
        color: #ffffff;
        padding: 0.875rem 1.5rem;
        border-radius: 12px;
        font-size: 0.9375rem;
        font-weight: 500;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
        backdrop-filter: blur(12px);
        z-index: 10000;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
      }

      .blog-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      [data-theme="dark"] .blog-toast {
        background: rgba(205, 214, 244, 0.95);
        color: #1e1e2e;
      }

      [data-theme="light"] .blog-toast {
        background: rgba(76, 79, 105, 0.95);
        color: #ffffff;
      }
    `;
    document.head.appendChild(style);
  }
})();
