interface ErrorAlertProps {
  message: string | null;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="alert alert-danger" style={{ whiteSpace: "pre-line" }}>
      {message}
    </div>
  );
}
