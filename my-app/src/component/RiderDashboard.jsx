// import React, { useState, useEffect } from "react";

// function RiderDashboard({ currentRider, riders, setRiders }) {
//     const [latestRequest, setLatestRequest] = useState(null);

//     useEffect(() => {
//         const fetchRequests = async () => {
//             try {
//                 const response = await fetch(
//                     "https://678a5a77dd587da7ac29c7dc.mockapi.io/sendCSTLocation/bikerideapp"
//                 );
//                 const data = await response.json();
//                 if (data.length > 0) {
//                     setLatestRequest(data[data.length - 1]);
//                 }
//             } catch (error) {
//                 console.error("Error fetching customer requests:", error);
//             }
//         };

//         fetchRequests();
//     }, []);

//     const acceptRequest = async () => {
//         const updatedRequest = {
//             ...latestRequest,
//             status: "Accepted",  // Status update
//         };
    
//         try {
//             const response = await fetch(
//                 `https://678a5a77dd587da7ac29c7dc.mockapi.io/sendCSTLocation/bikerideapp/${latestRequest.id}`,
//                 {
//                     method: "PUT",
//                     headers: {
//                         "Content-Type": "application/json",
//                     },
//                     body: JSON.stringify(updatedRequest),
//                 }
//             );
    
//             if (response.ok) {
//                 setLatestRequest(updatedRequest);
    
//                 // Log for debugging
//                 console.log("Request accepted and updated:", updatedRequest);
    
//                 // Update the rider state (if needed)
//                 const updatedRiders = riders.map((rider) => {
//                     if (rider.username === currentRider.username) {
//                         return {
//                             ...rider,
//                             requests: rider.requests.map((request) => ({
//                                 ...request,
//                                 status: "Accepted",
//                             })),
//                         };
//                     }
//                     return rider;
//                 });
    
//                 setRiders(updatedRiders);
//             } else {
//                 console.log("Failed to update request:", response.status);
//             }
//         } catch (error) {
//             console.error("Error accepting request:", error);
//         }
//     };
    
//     return (
//         <div>
//             <h2>Welcome, </h2>
//             {latestRequest ? (
//                 <div>
//                     <h3>Pickup: {latestRequest.pickupLocation}</h3>
//                     <h3>Drop: {latestRequest.dropLocation}</h3>
//                     <button onClick={acceptRequest}>Accept Request</button>
//                 </div>
//             ) : (
//                 <p>No requests available.</p>
//             )}
//         </div>
//     );
// }

// export default RiderDashboard;
import React, { useState, useEffect } from "react";
import axios from 'axios';

function RiderDashboard() {
    const [latestRequest, setLatestRequest] = useState(null);
    const [ws, setWs] = useState(null); // WebSocket state
    const [riderStatus, setRiderStatus] = useState('Offline'); // Rider's online/offline status

    useEffect(() => {
        // Check the rider's status from localStorage on component mount
        const riderStatusFromStorage = JSON.parse(localStorage.getItem('riderStatus'));
        if (riderStatusFromStorage && riderStatusFromStorage.status === 'online') {
            setRiderStatus('Online');
        } else {
            setRiderStatus('Offline');
        }

        // WebSocket connection for real-time updates
        const websocket = new WebSocket("ws://127.0.0.1:8080");

        websocket.onopen = () => {
            console.log("WebSocket connected");
        };

        websocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log("Received WebSocket message:", message);

            // Update the latest request with the new data
            if (message.requestId) {
                setLatestRequest((prevRequest) => {
                    if (prevRequest && prevRequest.id !== message.requestId) {
                        return { ...prevRequest, status: message.status };
                    }
                    return prevRequest;
                });
            }
        };

        websocket.onclose = () => {
            console.log("WebSocket closed");
        };

        setWs(websocket);

        return () => {
            websocket.close();
        };
    }, []);

    useEffect(() => {
        // Fetch latest request when the component mounts
        const fetchRequests = async () => {
            try {
                const response = await fetch(
                    "https://678a5a77dd587da7ac29c7dc.mockapi.io/sendCSTLocation/bikerideapp"
                );
                const data = await response.json();
                if (data.length > 0) {
                    setLatestRequest(data[data.length - 1]);
                }
            } catch (error) {
                console.error("Error fetching customer requests:", error);
            }
        };

        fetchRequests();
    }, []);

    const acceptRequest = async () => {
        if (riderStatus === 'Offline') {
            console.log("You are offline. Please set your status to online to accept requests.");
            return;
        }

        if (!latestRequest) {
            console.error("No latest request found!");
            return;
        }

        const updatedRequest = {
            ...latestRequest,
            status: "Accepted",
        };

        try {
            const response = await fetch(
                `https://678a5a77dd587da7ac29c7dc.mockapi.io/sendCSTLocation/bikerideapp/${latestRequest.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updatedRequest),
                }
            );

            if (response.ok) {
                setLatestRequest(updatedRequest);

                // Log that the request was accepted
                console.log(`Rider has accepted the request with ID ${updatedRequest.id}`);

                // Notify the customer about the accepted request via WebSocket
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(
                        JSON.stringify({
                            requestId: updatedRequest.id,
                            status: "accepted",
                            payload: `Rider accepted request with ID ${updatedRequest.id}`,
                            clientId: "Rider",
                        })
                    );
                }
            }
        } catch (error) {
            console.error("Error accepting request:", error);
        }
    };

    const toggleStatus = async () => {
        const newStatus = riderStatus === 'Online' ? 'Offline' : 'Online';

        // Get the current rider's email from localStorage
        const riderStatusFromStorage = JSON.parse(localStorage.getItem('riderStatus'));
        
        // Update the rider's status in the API
        if (riderStatusFromStorage && riderStatusFromStorage.email) {
            try {
                const response = await axios.get('https://6795e823bedc5d43a6c3bacc.mockapi.io/riderDetails');
                const rider = response.data.find(rider => rider.email === riderStatusFromStorage.email);
                
                if (rider) {
                    const updatedRider = { ...rider, status: newStatus }; // Toggle status
                    await axios.put(`https://6795e823bedc5d43a6c3bacc.mockapi.io/riderDetails/${rider.id}`, updatedRider);
                    console.log(`Rider status updated to ${newStatus}.`);
                }
            } catch (error) {
                console.error("Error updating rider status:", error);
            }
        }

        // Update the local status in localStorage and component state
        localStorage.setItem('riderStatus', JSON.stringify({ ...riderStatusFromStorage, status: newStatus }));
        setRiderStatus(newStatus);
    };

    const handleLogout = async () => {
        // Get the current rider's email from localStorage
        const riderStatusFromStorage = JSON.parse(localStorage.getItem('riderStatus'));
        
        // Update the rider's status to offline in the API
        if (riderStatusFromStorage && riderStatusFromStorage.email) {
            try {
                const response = await axios.get('https://6795e823bedc5d43a6c3bacc.mockapi.io/riderDetails');
                const rider = response.data.find(rider => rider.email === riderStatusFromStorage.email);
                
                if (rider) {
                    const updatedRider = { ...rider, status: 'Offline' };
                    await axios.put(`https://6795e823bedc5d43a6c3bacc.mockapi.io/riderDetails/${rider.id}`, updatedRider);
                    console.log(`Rider status updated to offline.`);
                }
            } catch (error) {
                console.error("Error updating rider status to offline:", error);
            }
        }

        // Remove rider's status from localStorage (logout)
        localStorage.removeItem("riderStatus");
        setRiderStatus("Offline"); // Update local status to offline
        window.location.href = "/login"; // Redirect to login page
    };

    return (
        <div>
            <h2>Welcome, Rider!</h2>
            <p>Status: {riderStatus}</p> {/* Display the Rider's Status */}

            {/* Switch Button to Toggle Online/Offline Status */}
            <label>
                <input
                    type="checkbox"
                    checked={riderStatus === 'Online'}
                    onChange={toggleStatus}
                />
                {riderStatus === 'Online' ? 'Go Offline' : 'Go Online'}
            </label>

            {latestRequest ? (
                <div>
                    <h3>Pickup: {latestRequest.pickupLocation}</h3>
                    <h3>Drop: {latestRequest.dropLocation}</h3>
                    <button onClick={acceptRequest}>Accept Request</button>
                </div>
            ) : (
                <p>No requests available.</p>
            )}

            {/* Logout button to set status as offline */}
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}

export default RiderDashboard;
