import { NotificationType } from "../constants";

export function setNotification(message: string, type: NotificationType) {
    const notificationMessage = document.getElementById("notification-message");
    notificationMessage.innerHTML = message;
  
    const notificationContainer = document.getElementById(
      "notification-container"
    );
    notificationContainer.classList.remove("hidden");
    notificationContainer.classList.add(type);
  }
  