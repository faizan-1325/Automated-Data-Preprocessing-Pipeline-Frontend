import React, { useState } from "react";
import axios from "axios";

const DataPreprocessingApp = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [workflow, setWorkflow] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [logs, setLogs] = useState([]);
  const [apiUrl, setApiUrl] = useState(""); // API URL state
  const [apiData, setApiData] = useState(null); // State for API data

  const techniquesList = [
    "Handle Missing Values",
    "Handle Duplicates",
    "Handle Outliers",
    "One Hot Encoding",
    "Date Extraction",
  ];

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setApiData(null); // Clear API data if a file is selected
    addLog(`File selected: ${e.target.files[0].name}`);
  };

  const handleDragStart = (e, technique) => {
    e.dataTransfer.setData("technique", technique);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const technique = e.dataTransfer.getData("technique");

    if (workflow.length > 0 && workflow[workflow.length - 1] === technique) {
      alert("You cannot apply the same technique consecutively!");
      return;
    }

    setWorkflow((prevWorkflow) => [...prevWorkflow, technique]);
    addLog(`Technique added: ${technique}`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!selectedFile && !apiData) {
      alert("Please upload a file or fetch data from an API");
      return;
    }
  
    if (selectedFile && apiData) {
      alert("Cannot process both datasets at once");
      return;
    }
  
    if (workflow.length === 0) {
      alert("Please add at least one technique to the workflow");
      return;
    }
  
    const formData = new FormData();
  
    if (selectedFile) {
      formData.append("file", selectedFile);
    } else if (apiData) {
      // Ensure apiData is valid and has a non-empty array
      if (!Array.isArray(apiData) || apiData.length === 0) {
        alert("Fetched API data is invalid or empty.");
        return;
      }
  
      try {
        // Convert API data to a Blob (CSV format)
        const csvContent = Object.keys(apiData[0])
          .join(",") + // Column headers
          "\n" +
          apiData
            .map((row) => Object.values(row).join(","))
            .join("\n"); // Rows data
  
        const blob = new Blob([csvContent], { type: "text/csv" });
        formData.append("file", blob, "apiData.csv");
      } catch (error) {
        console.error("Error converting API data to CSV:", error);
        alert("An error occurred while processing API data.");
        return;
      }
    }
  
    // Append techniques
    formData.append("techniques", JSON.stringify(workflow));
  
    try {
      setProcessing(true);
      setSuccess(false);
      setDownloadUrl(null);
      addLog("Processing started...");
  
      await processWorkflow(workflow);
  
      const response = await axios.post("http://localhost:5000/process", formData, {
        responseType: "blob",
      });
  
      if (response.status === 200 && response.data instanceof Blob) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        setDownloadUrl(url);
        setSuccess(true);
        addLog("Processing successful!");
      } else {
        console.error("Unexpected response:", response);
        alert("An error occurred while processing the file.");
      }
    } catch (error) {
      console.error("Error while processing the file:", error);
      addLog(`Error: ${error.message}`);
      alert("An error occurred. Please try again.");
    } finally {
      setProcessing(false);
    }
  };
  

  const addLog = (message) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  const processWorkflow = async (workflow) => {
    for (let i = 0; i < workflow.length; i++) {
      const technique = workflow[i];
      addLog(`Handling ${technique}...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      addLog(`${technique} completed successfully!`);
    }
  };

  const handleApiFetch = async () => {
    if (!apiUrl.trim()) {
      alert("Please enter a valid API URL");
      return;
    }

    try {
      const response = await axios.get(apiUrl);
      setApiData(response.data);
      setSelectedFile(null); // Clear file selection if API data is fetched
      addLog("API data fetched successfully!");
    } catch (error) {
      console.error("Error fetching data from API:", error);
      addLog(`Error fetching API data: ${error.message}`);
      alert("Failed to fetch data from the API. Please try again.");
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial, sans-serif" }}>
      <div style={{ flex: "1", padding: "20px", borderRight: "1px solid #ccc" }}>
        <h2>Data Preprocessing Techniques</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {techniquesList.map((technique) => (
            <li
              key={technique}
              draggable
              onDragStart={(e) => handleDragStart(e, technique)}
              style={{
                padding: "10px 15px",
                margin: "10px 0",
                backgroundColor: "#f0f0f0",
                border: "1px solid #ccc",
                borderRadius: "5px",
                cursor: "grab",
                textAlign: "center",
              }}
            >
              {technique}
            </li>
          ))}
        </ul>
        <div style={{ marginTop: "20px" }}>
          <label>
            <strong>Upload File:</strong>
          </label>
          <input type="file" onChange={handleFileChange} accept=".csv" style={{ marginTop: "10px" }} />
        </div>

        {/* API Source Section */}
        <div style={{ marginTop: "20px" }}>
          <label>
            <strong>API Source:</strong>
          </label>
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <input
              type="text"
              placeholder="Enter API URL"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              style={{
                flex: "1",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "5px",
              }}
            />
            <button
              onClick={handleApiFetch}
              style={{
                padding: "8px 15px",
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Fetch Data
            </button>
          </div>
        </div>

        {/* Logs Section */}
        <div
          style={{
            marginTop: "20px",
            maxHeight: "300px",
            overflowY: "auto",
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "5px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <h3>Logs</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {logs.map((log, index) => (
              <li key={index} style={{ marginBottom: "10px", fontSize: "14px", color: "#555" }}>
                {log}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        style={{
          flex: "2",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h2>Workflow Stack</h2>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            width: "80%",
            minHeight: "300px",
            border: "2px dashed #007bff",
            borderRadius: "5px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: workflow.length > 0 ? "flex-start" : "center",
            padding: "20px",
            backgroundColor: "#f9f9f9",
          }}
        >
          {workflow.length === 0 ? (
            <p style={{ color: "#888" }}>Drag and drop techniques here</p>
          ) : (
            workflow.map((technique, index) => (
              <div
                key={index}
                style={{
                  padding: "10px 15px",
                  margin: "10px 0",
                  backgroundColor: "#4caf50",
                  color: "#fff",
                  borderRadius: "5px",
                  width: "100%",
                  textAlign: "center",
                }}
              >
                {index + 1}. {technique}
              </div>
            ))
          )}
        </div>
        <button
          onClick={handleSubmit}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          disabled={processing}
        >
          {processing ? "Processing..." : "Submit Workflow"}
        </button>
        {success && downloadUrl && (
          <a
            href={downloadUrl}
            download="processed_file.csv"
            style={{
              marginTop: "10px",
              color: "#007bff",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Download Processed File
          </a>
        )}
      </div>
    </div>
  );
};

export default DataPreprocessingApp;
