import { useEffect, useRef } from "react";
import { connectSocket, disconnectSocket, getSocket } from "../utils/socket";

/**
 * Connects to the socket server and registers event listeners.
 * @param {Object} eventHandlers - Map of event names to handler functions
 *   e.g. { "proctoring:update": (data) => { ... } }
 */
const useSocket = (eventHandlers = {}) => {
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    const socket = connectSocket();

    const entries = Object.entries(handlersRef.current);
    entries.forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    const onConnect = () => console.log("Socket connected");
    const onDisconnect = (reason) => console.log("Socket disconnected:", reason);
    const onError = (err) => console.error("Socket connection error:", err);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    return () => {
      entries.forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
      disconnectSocket();
    };
  }, []);

  return getSocket();
};

export default useSocket;
