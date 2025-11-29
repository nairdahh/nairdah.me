//typed.js
if (document.getElementById('hello-there')) {
  var typed = new Typed('#hello-there', {
      strings: ['hello there!'],
      typeSpeed: 80,
      showCursor: false,
      startDelay: 200
    });
}

window.onload = function() {
  // delay to .lp-345
  if (document.querySelector('.lp-345')) {
    setTimeout(function() {
      var lp345 = document.querySelector('.lp-345');
      if (lp345) {
        lp345.style.transition = 'opacity 1s ease';
        lp345.style.opacity = 1;
      }
    }, 1900); // 1.35s delay
  }

  // delay to lp-line2
  if (document.querySelector('.lp-line2')) {
    setTimeout(function() {
      var lpline2 = document.querySelector('.lp-line2');
      if (lpline2) {
        lpline2.style.transition = 'opacity 1s ease';
        lpline2.style.opacity = 1;
      }
    }, 1200);
  }
};

var element = document.querySelector('.circle-image');
if (element) {
  element.addEventListener('animationend', function() {
    element.classList.remove('wow', 'animated', 'zoomIn');
  });
}

// Draggable code block functionality
(function() {
  const codeBlock = document.getElementById('draggable-code-block');
  if (!codeBlock) return;

  const placeholder = document.getElementById('code-block-placeholder');
  const header = codeBlock.querySelector('.code-block-header');

  // Window buttons functionality
  const minimizeBtn = header.querySelector('.minimize-btn');
  const maximizeBtn = header.querySelector('.maximize-btn');
  const closeBtn = header.querySelector('.close-btn');
  const placeholderMessage = document.getElementById('placeholder-message');
  const normalContent = codeBlock.querySelector('.normal-content');
  const maximizedContent = codeBlock.querySelector('.maximized-content');

  let isMinimized = false;
  let isMaximized = false;
  let isClosed = false;

  // Set placeholder height to match code-block after page loads
  setTimeout(() => {
    const codeBlockHeight = codeBlock.offsetHeight;
    if (placeholder) {
        placeholder.style.minHeight = codeBlockHeight + 'px';
    }
  }, 100);

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);

  // Touch events support
  header.addEventListener('touchstart', startDrag);
  document.addEventListener('touchmove', drag);
  document.addEventListener('touchend', stopDrag);

  // Double click to maximize/restore
  header.addEventListener('dblclick', () => {
    maximizeBtn.click();
  });

  function getEventCoords(e) {
    if (e.touches) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function startDrag(e) {
    if (e.button === 2) return; // Ignore right click
    
    // Ignore clicks on window buttons
    if (e.target.closest('.window-btn')) return;

    isDragging = true;
    const coords = getEventCoords(e);
    startX = coords.x;
    startY = coords.y;
    offsetX = currentX;
    offsetY = currentY;

    // Don't add dragging class yet, wait for movement
    e.preventDefault();
  }

  function drag(e) {
    if (!isDragging) return;

    const coords = getEventCoords(e);
    const deltaX = coords.x - startX;
    const deltaY = coords.y - startY;

    // Add a small threshold to prevent accidental drags
    if (!codeBlock.classList.contains('dragging') && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      return;
    }

    // Handle snap-out from maximized state on first drag movement
    if (isMaximized && !codeBlock.classList.contains('dragging')) {
      isMaximized = false;
      codeBlock.classList.remove('maximized');
      
      // Calculate dimensions
      const placeholderRect = placeholder.getBoundingClientRect();
      const restoredWidth = placeholder.offsetWidth;
      const restoredHeight = placeholder.offsetHeight; // Use placeholder height
      const headerHeight = header.offsetHeight;
      
      // 1. Prepare for animation
      // We are currently at full screen fixed 0,0
      // We want to animate to: width=restoredWidth, height=restoredHeight
      // And position: centered on mouse
      
      // Enable transitions
      codeBlock.style.transition = 'width 0.3s ease, height 0.3s ease, border-radius 0.3s ease';
      normalContent.style.transition = 'opacity 0.3s ease';
      maximizedContent.style.transition = 'opacity 0.3s ease';

      // Set initial state for content
      normalContent.style.display = 'block';
      normalContent.style.opacity = '0';
      
      // Force reflow
      void codeBlock.offsetWidth;
      
      // 2. Set target state
      codeBlock.style.width = restoredWidth + 'px';
      codeBlock.style.height = restoredHeight + 'px'; // Animate height too
      codeBlock.style.borderRadius = '12px';
      
      // Cross-fade
      maximizedContent.style.opacity = '0';
      normalContent.style.opacity = '1';

      // 3. Handle positioning
      // We need to calculate where the top-left should be so the header is centered on mouse
      const newCurrentX = (coords.x - (restoredWidth / 2)) - placeholderRect.left;
      const newCurrentY = (coords.y - (headerHeight / 2)) - placeholderRect.top;
      
      // Update drag state
      offsetX = newCurrentX;
      offsetY = newCurrentY;
      startX = coords.x;
      startY = coords.y;
      
      // Apply transform immediately (position snaps to mouse, size animates)
      codeBlock.style.transform = `translate(${newCurrentX}px, ${newCurrentY}px)`;
      
      codeBlock.classList.add('dragging');
      
      // 4. Cleanup after animation
      setTimeout(() => {
        codeBlock.style.transition = '';
        normalContent.style.transition = '';
        maximizedContent.style.transition = '';
        maximizedContent.style.display = 'none';
        
        // Ensure final state is clean
        codeBlock.style.width = '';
        codeBlock.style.height = '';
      }, 300);
      
      return; 
    }

    if (!codeBlock.classList.contains('dragging')) {
      codeBlock.classList.add('dragging');
    }

    currentX = offsetX + deltaX;
    currentY = offsetY + deltaY;

    codeBlock.style.transform = `translate(${currentX}px, ${currentY}px)`;
  }

  function stopDrag() {
    isDragging = false;
    codeBlock.classList.remove('dragging');
  }

  // Prevent double click on buttons from triggering maximize
  [minimizeBtn, maximizeBtn, closeBtn].forEach(btn => {
    btn.addEventListener('dblclick', (e) => {
      e.stopPropagation();
    });
  });

  minimizeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isMinimized = !isMinimized;

    if (isMinimized) {
      codeBlock.classList.add('minimized');
    } else {
      codeBlock.classList.remove('minimized');
    }
  });

  maximizeBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    isMaximized = !isMaximized;

    if (isMaximized) {
      // Remove minimize state if active
      isMinimized = false;
      codeBlock.classList.remove('minimized');

      // Set terminal-grid height to auto BEFORE animation
      const terminalGrid = codeBlock.querySelector('.terminal-grid');
      if (terminalGrid) {
        terminalGrid.style.height = 'auto';
      }

      // Set code-block-content max-height to 100vh BEFORE animation
      const codeBlockContent = codeBlock.querySelector('.code-block-content');
      if (codeBlockContent) {
        codeBlockContent.style.maxHeight = '100vh';
      }

      // 1. Calculate current position/size
      const rect = codeBlock.getBoundingClientRect();

      // Reset drag transform but keep visual position
      codeBlock.style.transform = 'none';
      currentX = 0;
      currentY = 0;
      offsetX = 0;
      offsetY = 0;

      // 2. Set explicit styles to freeze it visually
      codeBlock.style.position = 'fixed';
      codeBlock.style.top = rect.top + 'px';
      codeBlock.style.left = rect.left + 'px';
      codeBlock.style.width = rect.width + 'px';
      codeBlock.style.height = rect.height + 'px';
      codeBlock.style.maxHeight = '100vh';
      codeBlock.style.margin = '0';
      codeBlock.style.zIndex = '9999';

      // 3. Prepare content for cross-fade
      // Show maximized content absolutely positioned on top
      maximizedContent.style.display = 'block';
      maximizedContent.style.position = 'absolute';
      maximizedContent.style.top = '0';
      maximizedContent.style.left = '0';
      maximizedContent.style.width = '100%';
      maximizedContent.style.height = '100%';
      maximizedContent.style.opacity = '0';
      maximizedContent.style.zIndex = '10';
      
      // Update screen resolution
      const resEl = document.getElementById('screen-res');
      if (resEl) {
        resEl.textContent = `${window.screen.width}x${window.screen.height}`;
      }

      // 4. Force reflow
      void codeBlock.offsetWidth;
      void maximizedContent.offsetWidth;

      // 5. Animate expansion
      codeBlock.classList.add('animating-maximize');
      
      requestAnimationFrame(() => {
        codeBlock.style.top = '0';
        codeBlock.style.left = '0';
        codeBlock.style.width = '100vw';
        codeBlock.style.height = '100vh';
        codeBlock.style.borderRadius = '0';
        
        // Cross-fade
        normalContent.style.opacity = '0';
        maximizedContent.style.opacity = '1';
      });

      // 6. Cleanup after animation
      setTimeout(() => {
        normalContent.style.display = 'none';
        
        // Reset maximized content positioning to flow naturally
        maximizedContent.style.position = '';
        maximizedContent.style.top = '';
        maximizedContent.style.left = '';
        maximizedContent.style.width = '';
        maximizedContent.style.height = '';
        maximizedContent.style.zIndex = '';
        
        codeBlock.classList.add('maximized');
        codeBlock.classList.remove('animating-maximize');
        codeBlock.style.position = '';
        codeBlock.style.top = '';
        codeBlock.style.left = '';
        codeBlock.style.width = '';
        codeBlock.style.height = '';
        codeBlock.style.maxHeight = '';
        codeBlock.style.borderRadius = '';
        codeBlock.style.margin = '';

        // Reset terminal-grid height
        const terminalGrid = codeBlock.querySelector('.terminal-grid');
        if (terminalGrid) {
          terminalGrid.style.height = '';
        }

        // Reset code-block-content max-height
        const codeBlockContent = codeBlock.querySelector('.code-block-content');
        if (codeBlockContent) {
          codeBlockContent.style.maxHeight = '';
        }
      }, 500);

    } else {
      // Restore window

      // Check if minimized - if so, keep it minimized
      const wasMinimized = isMinimized;

      // If was minimized, ensure the minimize state is preserved
      if (wasMinimized) {
        isMinimized = true;
        codeBlock.classList.add('minimized');
      }

      // 1. Lock current state
      codeBlock.classList.remove('maximized');
      codeBlock.style.position = 'fixed';
      codeBlock.style.width = '100vw';
      codeBlock.style.height = '100vh';
      codeBlock.style.top = '0';
      codeBlock.style.left = '0';
      codeBlock.style.zIndex = '9999';

      // 2. Prepare content for cross-fade (skip if minimized)
      if (!wasMinimized) {
        // Show normal content absolutely positioned on top
        normalContent.style.display = 'block';
        normalContent.style.position = 'absolute';
        normalContent.style.top = '0';
        normalContent.style.left = '0';
        normalContent.style.width = '100%';
        normalContent.style.opacity = '0';
        normalContent.style.zIndex = '10';
      }
      
      // 3. Calculate target (placeholder)
      const placeholderRect = placeholder.getBoundingClientRect();
      
      // 4. Force reflow
      void codeBlock.offsetWidth;
      if (!wasMinimized) {
        void normalContent.offsetWidth;
      }

      // 5. Animate to target
      codeBlock.classList.add('animating-maximize');

      requestAnimationFrame(() => {
        codeBlock.style.width = placeholderRect.width + 'px';
        
        // If minimized, animate to header height instead of full placeholder height
        if (wasMinimized) {
          codeBlock.style.height = header.offsetHeight + 'px';
        } else {
          codeBlock.style.height = placeholderRect.height + 'px';
        }

        codeBlock.style.top = placeholderRect.top + 'px';
        codeBlock.style.left = placeholderRect.left + 'px';
        codeBlock.style.borderRadius = '12px';

        // Cross-fade (skip if minimized)
        if (!wasMinimized) {
          maximizedContent.style.opacity = '0';
          normalContent.style.opacity = '1';
        }
      });

      // 6. Cleanup after animation
      setTimeout(() => {
        maximizedContent.style.display = 'none';

        // Reset normal content positioning (skip if minimized)
        if (!wasMinimized) {
          normalContent.style.position = '';
          normalContent.style.top = '';
          normalContent.style.left = '';
          normalContent.style.width = '';
          normalContent.style.zIndex = '';
        }

        // ALWAYS reset display and opacity for normal content, 
        // otherwise it stays hidden if we restored to minimized state
        normalContent.style.display = '';
        normalContent.style.opacity = '';

        codeBlock.classList.remove('animating-maximize');
        codeBlock.style.position = '';
        codeBlock.style.top = '';
        codeBlock.style.left = '';
        codeBlock.style.width = '';
        codeBlock.style.height = '';
        codeBlock.style.zIndex = '';
        codeBlock.style.margin = '';

        // Ensure minimize state is preserved after cleanup
        if (wasMinimized) {
          isMinimized = true;
          codeBlock.classList.add('minimized');
        }
      }, 500);
    }
  });

  let closeTimeout;
  let justOpened = false;

  function openWindow() {
    isClosed = false;
    justOpened = true;

    // Disable close button to prevent phantom clicks
    closeBtn.style.pointerEvents = 'none';
    setTimeout(() => {
      justOpened = false;
      closeBtn.style.pointerEvents = '';
    }, 600);

    // Cancel pending close
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      closeTimeout = null;
    }

    // Hide placeholder
    placeholderMessage.classList.remove('show');
    placeholderMessage.style.display = 'none';

    // Show window with animation
    codeBlock.classList.remove('closed');
    codeBlock.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    codeBlock.style.opacity = '1';
    codeBlock.style.transform = 'scale(1)';

    // Clean up inline styles after animation so .closed class can work
    setTimeout(() => {
      if (!isClosed) {
        codeBlock.style.transition = '';
        codeBlock.style.opacity = '';
        codeBlock.style.transform = '';
      }
    }, 300);

    // Reset drag
    currentX = 0;
    currentY = 0;
    offsetX = 0;
    offsetY = 0;

    // Clear input
    commandInput.textContent = '';
    commandInput.style.color = '';
    commandError.style.display = 'none';
  }

  function closeWindow() {
    if (justOpened || isClosed) return;

    isClosed = true;
    codeBlock.classList.add('closed');

    closeTimeout = setTimeout(() => {
      if (isClosed) {
        placeholderMessage.style.display = 'block';
        void placeholderMessage.offsetWidth;
        placeholderMessage.classList.add('show');
        commandInput.textContent = '';
        commandError.style.display = 'none';
      }
    }, 300);
  }

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    closeWindow();
  });

  // Hidden command functionality
  const commandInput = document.getElementById('hidden-command-input');
  const commandError = document.getElementById('command-error');
  
  document.addEventListener('keydown', (e) => {
    if (!isClosed) return;

    // Handle backspace
    if (e.key === 'Backspace') {
      commandInput.textContent = commandInput.textContent.slice(0, -1);
      commandError.style.display = 'none';
      return;
    }

    // Handle enter
    if (e.key === 'Enter') {
      const command = commandInput.textContent.trim();
      
      if (command === 'display-window' || command === 'display-windows') {
        openWindow();
      } else {
        // Error
        commandError.style.display = 'block';
        
        // Shake effect
        commandInput.style.color = '#f38ba8';
        setTimeout(() => {
          commandInput.style.color = '#cdd6f4';
        }, 300);
      }
      return;
    }

    // Handle typing
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      if (commandInput.textContent.length < 40) {
        commandInput.textContent += e.key;
        commandError.style.display = 'none';
      }
    }
  });
})();

// Color palette click-to-copy functionality
document.addEventListener('DOMContentLoaded', function() {
  const colorSwatches = document.querySelectorAll('.color-swatch');

  // Function to calculate luminance and determine text color
  function getContrastColor(hexColor) {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light colors, white for dark colors
    return luminance > 0.5 ? '#1a1a21' : '#cdd6f4';
  }

  // Set CSS variables for each swatch
  colorSwatches.forEach(swatch => {
    const color = swatch.getAttribute('data-color');
    swatch.style.setProperty('--swatch-color', color);

    swatch.addEventListener('click', function(e) {
      e.preventDefault();

      const hexColor = this.getAttribute('data-color');
      const colorName = this.getAttribute('data-name');

      // Copy to clipboard
      navigator.clipboard.writeText(hexColor).then(() => {
        // Show visual feedback
        this.style.opacity = '0.7';
        setTimeout(() => {
          this.style.opacity = '1';
        }, 150);

        // Create and show notification
        const notification = document.createElement('div');
        notification.className = 'color-copy-notification';
        notification.textContent = `${hexColor.toUpperCase()} copied!`;

        // Set background to the copied color
        notification.style.backgroundColor = hexColor;
        notification.style.color = getContrastColor(hexColor);

        document.body.appendChild(notification);

        // Position notification near cursor
        const x = e.clientX + 15;
        const y = e.clientY - 10;
        notification.style.left = `${x}px`;
        notification.style.top = `${y}px`;

        // Show notification
        setTimeout(() => {
          notification.classList.add('show');
        }, 10);

        // Remove notification after animation
        setTimeout(() => {
          notification.classList.remove('show');
          setTimeout(() => {
            notification.remove();
          }, 200);
        }, 1000);

      }).catch(err => {
        console.error('Failed to copy color:', err);
      });
    });
  });
});
