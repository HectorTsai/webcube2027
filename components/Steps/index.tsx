import Steps from "./Steps.tsx";
import Step from "./Step.tsx";

export default Steps;
export { Step };

export interface StepsProps {
  children: unknown;
  vertical?: boolean;
  className?: string;
  variant?: "solid" | "outline" | "ghost" | "dot" | "dashed" | "double" | 
           "gradient-right" | "gradient-left" | "gradient-up" | "gradient-down" | "gradient-middle" |
           "gradient-diagonal" | "gradient-center" | "gradient-cone" | "crystal" | "diagonal-stripes" | "glow" | "minimalist";
}

export interface StepProps {
  children: unknown;
  active?: boolean;
  completed?: boolean;
  disabled?: boolean;
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" | "neutral";
  icon?: unknown;
  dataContent?: string;
  className?: string;
  index?: number;
}
