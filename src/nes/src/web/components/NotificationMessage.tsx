import * as React from "react";
import { NotificationType } from "../../constants";

export interface NotificationMessageProps {
  message: string;
  onDismissClick: () => void;
  visible: boolean;
  type: NotificationType;
}

export const NotificationMessage: React.FunctionComponent<
  NotificationMessageProps
> = (props: NotificationMessageProps) => {
  const { message, onDismissClick, visible, type } = props;

  if (visible) {
    return (
      <div className={`notification ${type}`} id="notification-container">
        <button
          className="delete"
          id="btn-dismiss-notification"
          onClick={onDismissClick}
        />
        <div id="notification-message">{message}</div>
      </div>
    );
  }

  return null;
};
