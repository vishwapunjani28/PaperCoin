import React, { useState, useEffect, useRef } from 'react';
import TradingViewWidgetEth from './TradingViewWidgetEth';
import logo from './logo.svg';
import { Route, Routes, useRoutes } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import "./home.css";
import Positions from './positionTemplate';


function Eth() {
    const [isPopupOpen, setPopupOpen] = useState(false);
    const [orderType, setOrderType] = useState(null);
    const popupRef = useRef(null);
    const [orderData, setOrdereData] = useState(null);
    const [entryPrice, setEntryPrice] = useState("");
    const [stopLoss, setStopLoss] = useState("");
    const [status, setStatusType] = useState("pending");
    const [takeProfit, setTakeProfit] = useState("");
    const [marketOrLimit, setMarketOrLimit] = useState("limit");
    const [btcusdt, setBtcusdt] = useState();
    const [marketOrders, setMarketOrders] = useState([]);
    const [marginUsed, setMarginUsed] = useState(0);
    const [limitOrders, SetLimitOrder] = useState([]);
    const [exelimitOrders, ExeSetLimitOrder] = useState();

    let url = "http://localhost:4000"
    useEffect(() => {
        // Create a new WebSocket instance
        const socket = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@trade'); // Change the URL to match your WebSocket server

        // Event listener for WebSocket connection open
        socket.onopen = () => {
            console.log('WebSocket connected');
        };

        // Event listener for WebSocket incoming messages
        socket.onmessage = (event) => {
            setBtcusdt(JSON.parse(event.data));
            // console.log(event.data);

        };

        // Event listener for WebSocket connection close
        socket.onclose = () => {
            console.log('WebSocket disconnected');
        };

        // Cleanup function to close the WebSocket connection when the component unmounts
        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, []);
    useEffect(() => {

        let margin = 0;
        let livepnl = 0;
        if (btcusdt !== null) {
            for (let i = 0; i < marketOrders.length; i++) {
                margin += parseFloat(marketOrders[i]["entry_price"]);

                if (marketOrders[i]["orderType"] == "buy") {
                    livepnl += btcusdt["p"] - parseFloat(marketOrders[i]["entry_price"]);
                }
                else {
                    livepnl += parseFloat(marketOrders[i]["entry_price"]) - btcusdt["p"];
                }
            }

            for (let i = 0; i < limitOrders.length; i++) {

                if (limitOrders[i]["entry_price"] == btcusdt["p"]) {
                    if (limitOrders[i]["orderType"] == "buy") {
                        handleOrder(orderType = "buy");

                        livepnl += btcusdt["p"] - parseFloat(limitOrders[i]["entry_price"]);
                    }
                }



            }


            if (livepnl >= 0) {
                document.getElementById("currentPNL").style.color = "blue";
            }
            else {
                document.getElementById("currentPNL").style.color = "red";
            }

            document.getElementById("currentPNL").innerHTML = livepnl?.toFixed(2);
            document.getElementById("margin").innerHTML = 1000000 - margin?.toFixed(2);
            document.getElementById("balance").innerHTML = 1000000 - livepnl?.toFixed(2);
        }
    }, [btcusdt]);

    useEffect(() => {
        if (btcusdt !== null) {
            // console.log(limitOrders);
            for (let i = 0; i < limitOrders.length; i++) {
                // console.log("NOT WORKING ");
                if (limitOrders[i]["entry_price"] == btcusdt["p"]) {
                    if (limitOrders[i]["orderType"] == "buy") {
                        let bod = limitOrders[i];
                        console.log(bod);
                        handleLimit(bod);
                        limitOrders.pop(i);
                        marketOrders.push(i);
                        window.location.reload();
                    }

                }

            }
        }
    }, [btcusdt]);

    // Stop loss logic
    useEffect(() => {
        if (btcusdt !== null) {
            // console.log(limitOrders);
            for (let i = 0; i < marketOrders.length; i++) {
                // console.log("NOT WORKING ");
                if (btcusdt["p"] <= marketOrders[i]["stop_loss"]) {
                    if (marketOrders[i]["orderType"] == "buy") {
                        let bod = marketOrders[i];
                        bod["triggered"] = "stopLoss";
                        console.log(bod);
                        handleStopLoss(bod);
                        let livepnl = livepnl + parseFloat(marketOrders[i]["entry_price"]) - parseFloat(marketOrders[i]["stop_loss"]);
                        document.getElementById("currentPNL").innerHTML = livepnl;
                        document.getElementById("balance").innerHTML = 1000000 - livepnl;
                        window.alert("StopLoss is triggered: \n" + bod);
                        window.location.reload();
                    }
                }

            }
        }
    }, [btcusdt]);


    function handleStopLoss(key) {
        let order =
        {
            "symbol": "ETHUSDT",
            "marketOrLimit": key.marketOrLimit,
            "orderType": key.orderType,
            "entry_price": key.entry_price,
            "key": key.key,
            "stop_loss": key.stop_loss,
            "take_profit": key.take_profit,
            "triggered": key.triggered
        };

        console.log("***** StopLoss *** Order place")
        fetch(url + '/updateOrder', {
            method: 'POST',
            body: JSON.stringify(order),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });


    }

    // Take profit logic
    useEffect(() => {
        if (btcusdt !== null) {
            // console.log(limitOrders);
            for (let i = 0; i < marketOrders.length; i++) {
                if (btcusdt["p"] <= marketOrders[i]["take_profit"] && marketOrders[i]["take_profit"] != "") {
                    if (marketOrders[i]["orderType"] == "buy") {
                        let bod = marketOrders[i];
                        bod["triggered"] = "takeProfit";
                        console.log(bod);
                        handleStopLoss(bod);
                        let livepnl = livepnl + parseFloat(marketOrders[i]["entry_price"]) + parseFloat(marketOrders[i]["stop_loss"]);
                        document.getElementById("currentPNL").innerHTML = livepnl;
                        document.getElementById("balance").innerHTML = 1000000 - livepnl;
                        window.alert("StopLoss is triggered: \n" + bod);
                        window.location.reload();
                    }
                }
            }
        }
    }, [btcusdt]);


    function handleTake_Profit(key) {
        let order =
        {
            "symbol": "ETHUSDT",
            "marketOrLimit": key.marketOrLimit,
            "orderType": key.orderType,
            "entry_price": key.entry_price,
            "key": key.key,
            "stop_loss": key.stop_loss,
            "take_profit": key.take_profit,
        };

        console.log("***** Take Profit *** Order place")
        fetch(url + '/updateOrder', {
            method: 'POST',
            body: JSON.stringify(order),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });


    }







    function handleLimit(key) {
        let order =
        {
            "symbol": "ETHUSDT",
            "marketOrLimit": key.marketOrLimit,
            "orderType": key.orderType,
            "entry_price": key.entry_price,
            "key": key.key,
            "stop_loss": key.stop_loss,
            "take_profit": key.take_profit,
        };

        console.log("***** LIMIT Order place")
        fetch(url + '/delOrder', {
            method: 'POST',
            body: JSON.stringify(order),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });


    }

    function handleEventData(event) {
        setBtcusdt(JSON.parse(event.data));
    }

    useEffect(() => {

        function handleClickOutside(event) {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setPopupOpen(false);
            }

            if (marketOrLimit == "market") {
                hideshowdiv(1);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [popupRef]);

    useEffect(() => {
        fetch(url + '/getOrders', {
            method: 'POST',
            body: JSON.stringify({}),
            headers: new Headers({
                Accept: 'application/json',
                'Content-Type': 'multipart/form-data'
            }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                var tempMarket = [];
                for (let key in data["market"]) {
                    tempMarket.push(data["market"][key]);
                }
                setMarketOrders(tempMarket);
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });
    }, []);



    useEffect(() => {
        // #TODO: NGROK
        fetch(url + '/getOrders', {
            method: 'POST',
            body: JSON.stringify({}),
            headers: new Headers({
                Accept: 'application/json',
                'Content-Type': 'multipart/form-data'
            }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                var tempMarket = [];
                for (let key in data["limit"]) {
                    tempMarket.push(data["limit"][key]);
                }
                SetLimitOrder(tempMarket);
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });
    }, []);


    function hideshowdiv(val) {
        if (val === 1) {
            document.getElementById("div").style.display = 'none';
        }
        if (val === 2) {
            document.getElementById("div").style.display = 'block';
        }
    }

    const handleMarketOrLimit = (e) => {
        setMarketOrLimit(e.target.value);
    }

    const handlestopLoss = (e) => {

        setStopLoss(e.target.value);
    }

    const handlestatus = (e) => {

        setStatusType(e.target.value);
    }

    const handleTakeProfit = (e) => {
        setTakeProfit(e.target.value);
    }

    const handlePrice = (e) => {
        setEntryPrice(e.target.value);
    }

    function openPopup() {
        setPopupOpen(true);
    }

    function closePopup() {
        setPopupOpen(false);
    }
    var sellButton = document.getElementById("sellButton");
    var buyButton = document.getElementById("buyButton");

    function handleBuy() {
        setOrderType('buy');
        buyButton.style.backgroundColor = "green";
        sellButton.style.backgroundColor = "blue";
    }

    function handleSell() {
        setOrderType('sell');

        buyButton.style.backgroundColor = "blue";
        sellButton.style.backgroundColor = "red";
    }

    function handleOrder() {

        let order = {};

        if (marketOrLimit == "market") {
            order =
            {
                "symbol": "ETHUSDT",
                "marketOrLimit": marketOrLimit,
                "orderType": orderType,
                "entry_price": btcusdt["p"],
                "stop_loss": stopLoss,
                "take_profit": takeProfit,
            };
        }
        else {
            order =
            {
                "symbol": "ETHUSDT",
                "marketOrLimit": marketOrLimit,
                "orderType": orderType,
                "entry_price": entryPrice,
                "stop_loss": stopLoss,
                "take_profit": takeProfit,
            };
        }
        console.log("Order place")

        // #TODO: NGROK
        fetch(url + '/newOrder', {
            method: 'POST',
            body: JSON.stringify(order),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });

        window.location.reload()
    }

    return (

        <>
            <div id="parent">
                <div className="container1">
                    <button className="settings-button" onClick={() => { window.location.href = 'setting.js' }}>
                        <img src={logo} alt="Logo" className="logo" />
                    </button>
                    <h1>Balance</h1>
                    <p id='balance'>000000</p>
                    <div className="row">
                        <div className="column">
                            <h4>Available Margin</h4>
                            <p id='margin'>000000 $</p>
                        </div>
                        <div className="column">
                            <h4>Current P&L</h4>
                            <p id='currentPNL'>000000</p>
                        </div>
                    </div>
                    <button type="button" className="button" onClick={openPopup}>Order</button>
                    <div className={isPopupOpen ? "popup open-popup" : "popup"} ref={popupRef} id="popup">
                        <div className="row">
                            <button type="button" className="button11" id='buyButton' onClick={handleBuy}>Buy</button>
                            <button type="button" className="button11" id='sellButton' onClick={handleSell}>Sell</button>
                        </div>
                        <div>.</div>
                        <div className="radiobutton">
                            <label className="radio-inline">
                                <input type="radio" value="market" checked={marketOrLimit === "market"} onChange={handleMarketOrLimit} name="optradio" onClick={() => hideshowdiv(1)} />Market
                                <span className="check"></span>
                            </label>
                            <label className="radio-inline">
                                <input type="radio" value="limit" checked={marketOrLimit === "limit"} onChange={handleMarketOrLimit} name="optradio" onClick={() => hideshowdiv(2)} />Limit
                                <span className="checkmark"></span>
                            </label>
                        </div>
                        <div>.</div>
                        <div>
                            <label className="label1">Stop Loss</label>
                            <input className="input1" onChange={handlestopLoss} type="number" name="fname" />
                            <div>.</div>
                            <label className="label1">Take Profit</label>
                            <input className="input1" onChange={handleTakeProfit} type="number" name="lname" />
                            <div>.</div>
                            <div id="div">
                                <label className="label1">Price</label>
                                <input className="input2" id='priceInputBox' onChange={handlePrice} type="number" name="lname" />
                            </div>
                            <div>.</div>
                        </div>
                        <button type="button" className="button2" onClick={handleOrder}>{orderType ? `${orderType} Order` : 'Order'}</button>
                    </div>
                    {btcusdt && marketOrders.map((ord, index) => {
                        if (ord["orderType"] == "buy" || ord["orderType"] == "sell") {
                            // console.log(ord);
                            return (
                                <>
                                    <Positions orders={ord} currentPrice={btcusdt["p"]} />
                                </>
                            );
                        } else {
                            return null; // or any other JSX component if needed
                        }
                    })}

                    {btcusdt && limitOrders.map((ord, index) => {
                        if (ord["orderType"] == "buy" || ord["orderType"] == "sell") {
                            // console.log(ord);
                            return (
                                <>
                                    <Positions orders={ord} currentPrice={btcusdt["p"]} />
                                </>
                            );
                        } else {
                            return null; // or any other JSX component if needed
                        }
                    })}


                </div>
                <div className="container2">
                    <TradingViewWidgetEth />
                </div>
            </div>

        </>
    );
}

export default Eth;