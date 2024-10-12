import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import axios from "axios";

const Output = forwardRef(({ job, jobOutputs, setJobOutputs }, ref) => {
  const outputQueue = useRef([]); // Queue to hold incoming lines temporarily
  const eventSourceRef = useRef(null); // To keep track of the EventSource instance

  // Make the clearOutput method available to the parent component
  useImperativeHandle(ref, () => ({
    clearOutput() {
      if (!job) return; // Ensure job is not null
      setJobOutputs((prevOutputs) => ({
        ...prevOutputs,
        [job.name]: "",
      }));
      outputQueue.current = []; // Clear the output queue as well
      if (eventSourceRef.current) {
        eventSourceRef.current.close(); // Close any active event source connection
        eventSourceRef.current = null;
      }
    },
  }));

  useEffect(() => {
    if (!job) return;

    // Clear outputQueue and any existing EventSource before starting new stream
    outputQueue.current = [];
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Function to fetch existing log content
    const fetchLogContent = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8001/get-log/${job.name}`,
        );
        const content = response.data.content;
        if (content) {
          setJobOutputs((prevOutputs) => ({
            ...prevOutputs,
            [job.name]: content,
          }));
        } else {
          setJobOutputs((prevOutputs) => {
            if (prevOutputs[job.name]) {
              return prevOutputs;
            } else {
              return {
                ...prevOutputs,
                [job.name]: "No output yet.",
              };
            }
          });
        }
      } catch (error) {
        console.error("Error fetching log content:", error);
        setJobOutputs((prevOutputs) => {
          if (prevOutputs[job.name]) {
            return prevOutputs;
          } else {
            return {
              ...prevOutputs,
              [job.name]: "Error fetching log content.",
            };
          }
        });
      }
    };

    fetchLogContent();

    // Establish connection to the job-specific output streaming API
    eventSourceRef.current = new EventSource(
      `http://localhost:8001/stream-output/${job.name}`,
    );

    eventSourceRef.current.onmessage = (event) => {
      const newLine = event.data + "\n";
      outputQueue.current.push(newLine);
    };

    eventSourceRef.current.onerror = (event) => {
      console.error("Error receiving output stream:", event);
      eventSourceRef.current.close();
    };

    // Interval to process and display lines from the queue with a delay
    const intervalId = setInterval(() => {
      if (outputQueue.current.length > 0) {
        const nextLine = outputQueue.current.shift();
        setJobOutputs((prevOutputs) => ({
          ...prevOutputs,
          [job.name]: (prevOutputs[job.name] || "") + nextLine,
        }));
      }
    }, 50); // Adjust the delay (50ms) between each line as needed

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      clearInterval(intervalId);
    };
  }, [job]); // Dependency on the job

  return (
    <div
      style={{
        backgroundColor: "#f0f0f0",
        height: "100%",
        width: "100%",
        overflowY: "auto",
        padding: "10px",
      }}
    >
      <h3>Job Output</h3>
      <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
        {job ? jobOutputs[job.name] || "No output yet." : ""}
      </pre>
    </div>
  );
});

export default Output;
