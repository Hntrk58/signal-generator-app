import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SignalGenerator() {
  const [currentDigit, setCurrentDigit] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [result, setResult] = useState(null);
  const [ws, setWs] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [signalStrength, setSignalStrength] = useState(0);

  useEffect(() => {
    const socket = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
    setWs(socket);

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          ticks: "R_10",
          subscribe: 1,
        })
      );
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.tick) {
        const price = data.tick.quote;
        const digit = parseInt(price.toString().slice(-1));
        setCurrentDigit(digit);
        makePrediction(digit);
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  const makePrediction = (digit) => {
    const pred = Math.random() < 0.5 ? "Even" : "Odd";
    setPrediction(pred);
    const correct = (digit % 2 === 0 && pred === "Even") || (digit % 2 !== 0 && pred === "Odd");
    setResult(correct ? "Correct" : "Wrong");
    setTotalCount((prev) => prev + 1);
    if (correct) setCorrectCount((prev) => prev + 1);

    // Update signal strength (simple mock: confidence based on recent accuracy)
    const accuracy = ((correctCount + (correct ? 1 : 0)) / (totalCount + 1)) * 100;
    setSignalStrength(accuracy.toFixed(2));
  };

  const getDuration = () => {
    const duration = Date.now() - startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center bg-[#0f0f0f] border border-gray-800 shadow-lg rounded-2xl">
        <CardContent className="space-y-6 py-8">
          <h1 className="text-3xl font-extrabold text-green-400 tracking-wide">
            Signal Generator
          </h1>

          <div className="text-6xl font-mono text-yellow-400">
            {currentDigit !== null ? currentDigit : "-"}
          </div>

          <div className="text-xl">
            Prediction: <Badge className="bg-purple-700 text-white px-3 py-1 ml-2">{prediction}</Badge>
          </div>

          <div className="text-lg">
            Result:
            {result === "Correct" ? (
              <span className="text-green-400 ml-2">✅ Correct</span>
            ) : result === "Wrong" ? (
              <span className="text-red-400 ml-2">❌ Wrong</span>
            ) : (
              <span className="text-gray-400 ml-2">Waiting...</span>
            )}
          </div>

          <div className="text-sm text-gray-300 space-y-1">
            <div>Duration: <span className="text-white font-semibold">{getDuration()}</span></div>
            <div>Accuracy: <span className="text-white font-semibold">{((correctCount / totalCount) * 100 || 0).toFixed(2)}%</span></div>
            <div>Signal Strength: <span className="text-white font-semibold">{signalStrength}%</span></div>
          </div>

          <Button onClick={() => makePrediction(currentDigit)} className="bg-green-600 hover:bg-green-700 rounded-xl px-6 py-2 text-lg">
            Generate New Prediction
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
