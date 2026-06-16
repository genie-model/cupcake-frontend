import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import api from "../api";

// Job states during which the model may still be producing log output.
const ACTIVE_STATES = ["QUEUED", "RUNNING", "PAUSE_REQUESTED", "PAUSED"];

const Output = forwardRef(({ job, jobOutputs, setJobOutputs }, ref) => {
  const intervalRef = useRef(null);

  // Parent calls this when a job is deleted.
  useImperativeHandle(ref, () => ({
    clearOutput() {
      if (!job) return;
      setJobOutputs((prev) => ({ ...prev, [job.name]: "" }));
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    },
  }));

  useEffect(() => {
    if (!job) return;
    let cancelled = false;

    // Pull the full run.log from the API. The runner syncs it to the Filestore
    // every ~2s, so polling get-log mirrors live progress without depending on
    // a tail-from-end SSE (which skipped everything written before it connected
    // and broke when the log file was replaced on each sync).
    const fetchLog = async () => {
      try {
        const res = await api.get(`/get-log/${job.name}`);
        if (cancelled) return;
        setJobOutputs((prev) => ({ ...prev, [job.name]: res.data.content || "" }));
      } catch (err) {
        // Keep whatever we already have; transient errors are expected while a
        // pod is spinning up.
        console.error("Error fetching log content:", err);
      }
    };

    // Fetch immediately, then poll only while the job is still active.
    fetchLog();
    if (ACTIVE_STATES.includes(job.status)) {
      intervalRef.current = setInterval(fetchLog, 2000);
    }

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // Re-runs when the job changes OR its status transitions (e.g. RUNNING →
    // COMPLETE), which restarts/stops polling appropriately.
  }, [job?.name, job?.status, setJobOutputs]);

  const content = job ? jobOutputs[job.name] : "";
  const isActive = job && ACTIVE_STATES.includes(job.status);

  let body;
  if (content) {
    body = content;
  } else if (isActive) {
    body =
      "⏳  Job is starting — the compute instance is spinning up.\n" +
      "Logs will appear here automatically once the model begins running.";
  } else {
    body = "No output yet.";
  }

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
      <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>{body}</pre>
    </div>
  );
});

export default Output;
