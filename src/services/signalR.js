import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import * as signalRMsgPack from '@microsoft/signalr-protocol-msgpack';
import { EventEmitter } from 'events';
import Storage from '#services/storage';

const SignalRContext = createContext();

// Emitter name for order create/close events (refetch active strategies / orders / details)
export const ORDER_EVENT_EMITTER_NAME = "order-event";

// Order-event group ID is dynamic per customer (same as API: decrypted customerID from localStorage)
const getOrderEventGroupId = () => {
  const customerId = Storage.decryptData(localStorage.getItem("customerID"));
  return customerId != null && customerId !== '' ? String(customerId) : null;
};

export const SignalRProvider = ({ children }) => { 

  const hubConnection = useRef(null);
  const reconnectInterval = 30000; // Retry every 30 seconds (for normal reconnection)
  const fastReconnectInterval = 1000; // Fast retry for network recovery (1 second)
  const lastMessageTimestamp = useRef(null);
  const [isConnectionActive, setIsConnectionActive] = useState(false);
  const apiHitStatus = useRef({});
  const emitter = useRef(new EventEmitter());
  const logs = []; // ✅ Global logs array to store logs
  const networkRecoveryModeRef = useRef(false); // Track if network just recovered

  // ✅ Start connection
  const startConnection = () => {
    
    if (!hubConnection.current) {
   
      hubConnection.current = new signalR.HubConnectionBuilder()
      .withUrl('https://socket.algoresponcetrading.in/chathub', {
        accessTokenFactory: () => '1212-1212-1212_www5e9eb82c38bffe63233e6084c08240ttt',
          withCredentials: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Silent reconnection - no console output
            if (retryContext.previousRetryCount === 0) return 0;
            if (retryContext.previousRetryCount === 1) return 2000;
            if (retryContext.previousRetryCount === 2) return 10000;
            return 30000;
          }
        })
        .withHubProtocol(new signalRMsgPack.MessagePackHubProtocol())
        .configureLogging(signalR.LogLevel.None)
        .build();

      registerConnectionHandlers();
    }

    if (hubConnection.current.state !== signalR.HubConnectionState.Connected) {
     
      hubConnection.current
        .start()
        .then(() => {
         
          setIsConnectionActive(true);
          sendPingImmediately();
        })
        .catch((err) => {
          retryConnection();
        });
    }
  };

  // ✅ Register connection handlers
  const registerConnectionHandlers = () => {
    hubConnection.current.onclose((error) => {
      setIsConnectionActive(false);
      retryConnection();
    });

    hubConnection.current.onreconnecting((error) => {
      setIsConnectionActive(false);
    });

    hubConnection.current.onreconnected(() => {
      setIsConnectionActive(true);
      sendPingImmediately();
    });
  };

  // ✅ Retry connection - uses fast interval if network just recovered
  const retryConnection = () => {
    if (
      hubConnection.current &&
      (hubConnection.current.state === signalR.HubConnectionState.Connected ||
        hubConnection.current.state === signalR.HubConnectionState.Connecting)
    ) {
      return;
    }

    // Use fast reconnect if network just recovered, otherwise use normal interval
    const interval = networkRecoveryModeRef.current ? fastReconnectInterval : reconnectInterval;
    
    setTimeout(() => {
      if (hubConnection.current && hubConnection.current.state === signalR.HubConnectionState.Disconnected) {
        hubConnection.current
          .start()
          .then(() => {
            setIsConnectionActive(true);
            sendPingImmediately();
            networkRecoveryModeRef.current = false; // Reset after successful connection
          })
          .catch((error) => {
            retryConnection();
          });
      }
    }, interval); 
  };

  // ✅ Send immediate ping after reconnect
  const sendPingImmediately = () => {
    if (hubConnection.current && hubConnection.current.state === signalR.HubConnectionState.Connected) {
      hubConnection.current
        .send('Ping')
        .then(() => {})
        .catch((error) => {});
    }
  };

  // ✅ Handle tab visibility
  const handleTabVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      if (hubConnection.current && hubConnection.current.state === signalR.HubConnectionState.Disconnected) {
        startConnection();
      }
    }
  };

  // ✅ Handle network change - immediate connection when network comes back
  const handleNetworkChange = () => {
    if (navigator.onLine) {
      // Network came back - connect immediately (no repeated checks)
      networkRecoveryModeRef.current = true;
      // Connect immediately without delay
      if (hubConnection.current) {
        if (hubConnection.current.state === signalR.HubConnectionState.Disconnected) {
          hubConnection.current
            .start()
            .then(() => {
              setIsConnectionActive(true);
              sendPingImmediately();
              networkRecoveryModeRef.current = false;
            })
            .catch((error) => {
              // If immediate connection fails, retry once quickly
              setTimeout(() => {
                if (hubConnection.current && hubConnection.current.state === signalR.HubConnectionState.Disconnected) {
                  hubConnection.current
                    .start()
                    .then(() => {
                      setIsConnectionActive(true);
                      sendPingImmediately();
                      networkRecoveryModeRef.current = false;
                    })
                    .catch(() => {
                      networkRecoveryModeRef.current = false;
                    });
                }
              }, 500); // Single quick retry after 500ms
            });
        } else if (hubConnection.current.state === signalR.HubConnectionState.Connected) {
          // Already connected - just update state
          setIsConnectionActive(true);
          networkRecoveryModeRef.current = false;
        }
      } else {
        // No connection exists - create and start
        startConnection();
      }
    } else {
      // Network went offline
      setIsConnectionActive(false);
      networkRecoveryModeRef.current = false;
    }
  };

    // ✅ Original Functions (Memoized)
  const addTransferChart = useCallback((id) => {
    if (!hubConnection.current || hubConnection.current.state !== signalR.HubConnectionState.Connected) {
      return;
    } 
    apiHitStatus.current['TransferChart'] = true;

  
    hubConnection.current.invoke('AddToGroup', id).catch((err) => {
    });

    hubConnection.current.on(id, (event, message) => {
      lastMessageTimestamp.current = Date.now();
      emitter.current.emit(id, message);
    });
  }, []);

  const ordersignalr = useCallback((id) => {
   
    if (!hubConnection.current || hubConnection.current.state !== signalR.HubConnectionState.Connected) return;
    apiHitStatus.current['OrderSignalr'] = true;

 
    hubConnection.current.invoke('AddToGroup', id).catch((err) => {
      // Error handling
    });

   
    hubConnection.current.on(id, (event, message) => {
      lastMessageTimestamp.current = Date.now();
      emitter.current.emit(id, message);
      // console.log("message",id, message);
    });
  }, []);

  useEffect(() => {
    startConnection();

    document.addEventListener('visibilitychange', handleTabVisibilityChange);
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    return () => {
      if (hubConnection.current) hubConnection.current.stop();
      document.removeEventListener('visibilitychange', handleTabVisibilityChange);
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, []);

  // Subscribe to order-event group when connection is active (group = customerId, same as API)
  useEffect(() => {
    if (!isConnectionActive || !hubConnection.current) return;
    const orderEventGroupId = getOrderEventGroupId();
    if (!orderEventGroupId) return;
    const hub = hubConnection.current;
    // Debug: see which customer/group we are subscribing to
    // eslint-disable-next-line no-console
    console.log('[SignalR] Subscribing to order group:', orderEventGroupId);

    hub.invoke('AddToGroup', orderEventGroupId).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[SignalR] Failed to join order group', orderEventGroupId, err);
    });
    hub.on(orderEventGroupId, (event, message) => {
      lastMessageTimestamp.current = Date.now();
      // Debug: see raw order-event messages coming from backend
      // eslint-disable-next-line no-console
      console.log('[SignalR] Order event received:', { groupId: orderEventGroupId, event, message });
      emitter.current.emit(ORDER_EVENT_EMITTER_NAME, message);
    });
  }, [isConnectionActive]);

  return (
    <SignalRContext.Provider
      value={{
        addTransferChart,
        ordersignalr,
        isConnectionActive,
        emitter: emitter.current,
        logs,
        hubConnection: hubConnection.current
      }}
    >
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (!context) {
    return null;
  }
  return context;
};
  