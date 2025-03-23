import { useState } from 'react';

interface AlertConfig {
  title: string;
  message: string;
  buttons: {
    text: string;
    onPress: () => void;
    style?: 'default' | 'destructive';
  }[];
}

export function useAlert() {
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  const show = (config: AlertConfig) => {
    setAlertConfig(config);
    setShowAlert(true);
  };

  const hide = () => {
    setShowAlert(false);
    setAlertConfig(null);
  };

  return {
    showAlert,
    alertConfig,
    show,
    hide
  };
} 