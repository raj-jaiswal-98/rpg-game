export type ToastType = "error" | "success" | "warning" | "info";

export interface ToastOptions {
  duration?: number; // milliseconds, default 3000
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
}

/**
 * Simple toast notification system
 */
export class Toast {
  private static readonly CONTAINER_ID = "toast-container";
  private static readonly DEFAULT_DURATION = 3000;
  private static readonly DEFAULT_POSITION = "top-right";

  /**
   * Show a toast notification
   * @param message Message to display
   * @param type Type of toast (error, success, warning, info)
   * @param options Toast options (duration, position)
   */
  static show(message: string, type: ToastType = "info", options: ToastOptions = {}): void {
    const duration = options.duration ?? this.DEFAULT_DURATION;
    const position = options.position ?? this.DEFAULT_POSITION;

    // Ensure container exists
    this.ensureContainer(position);

    // Create toast element
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Add to container
    const container = document.getElementById(this.CONTAINER_ID);
    if (container) {
      container.appendChild(toast);

      // Remove after duration
      setTimeout(() => {
        toast.classList.add("fade-out");
        setTimeout(() => {
          toast.remove();
        }, 300);
      }, duration);
    }
  }

  /**
   * Show error toast
   */
  static error(message: string, options?: ToastOptions): void {
    this.show(message, "error", options);
  }

  /**
   * Show success toast
   */
  static success(message: string, options?: ToastOptions): void {
    this.show(message, "success", options);
  }

  /**
   * Show warning toast
   */
  static warning(message: string, options?: ToastOptions): void {
    this.show(message, "warning", options);
  }

  /**
   * Show info toast
   */
  static info(message: string, options?: ToastOptions): void {
    this.show(message, "info", options);
  }

  /**
   * Ensure toast container exists in the DOM
   */
  private static ensureContainer(position: string): void {
    let container = document.getElementById(this.CONTAINER_ID);
    
    if (!container) {
      container = document.createElement("div");
      container.id = this.CONTAINER_ID;
      container.className = `toast-container toast-${position}`;
      
      // Add styles if not already in document
      if (!document.getElementById("toast-styles")) {
        this.injectStyles();
      }
      
      document.body.appendChild(container);
    }

    // Update position class
    container.className = `toast-container toast-${position}`;
  }

  /**
   * Inject toast styles into the document
   */
  private static injectStyles(): void {
    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `
      .toast-container {
        position: fixed;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 9999;
        pointer-events: none;
      }

      .toast-container.toast-top-left {
        top: 20px;
        left: 20px;
      }

      .toast-container.toast-top-center {
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
      }

      .toast-container.toast-top-right {
        top: 20px;
        right: 20px;
      }

      .toast-container.toast-bottom-left {
        bottom: 20px;
        left: 20px;
      }

      .toast-container.toast-bottom-center {
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
      }

      .toast-container.toast-bottom-right {
        bottom: 20px;
        right: 20px;
      }

      .toast {
        padding: 12px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        pointer-events: auto;
        animation: slideIn 0.3s ease-out;
      }

      .toast.fade-out {
        animation: slideOut 0.3s ease-out;
      }

      .toast-error {
        background-color: #f87171;
        color: white;
        border-left: 4px solid #dc2626;
      }

      .toast-success {
        background-color: #34d399;
        color: white;
        border-left: 4px solid #059669;
      }

      .toast-warning {
        background-color: #fbbf24;
        color: #78350f;
        border-left: 4px solid #d97706;
      }

      .toast-info {
        background-color: #60a5fa;
        color: white;
        border-left: 4px solid #2563eb;
      }

      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
