import { Alert } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

interface ErrorAlertProps {
  message: string | null;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <Alert
      color="red"
      variant="light"
      icon={<IconAlertTriangle size={18} />}
      mb="md"
      style={{ whiteSpace: "pre-line" }}
    >
      {message}
    </Alert>
  );
}
