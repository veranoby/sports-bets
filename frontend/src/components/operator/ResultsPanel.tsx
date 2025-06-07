import ResultRecorder from "./ResultRecorder";

const ResultsPanel: React.FC = () => {
  const handleRecordResult = async (result: "red" | "blue" | "draw") => {
    await fetch(`/api/fights/${fightId}/result`, {
      method: "POST",
      body: result,
    });
  };

  return <ResultRecorder isActive={true} onRecordResult={handleRecordResult} />;
};
