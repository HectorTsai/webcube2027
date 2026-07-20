import Steps from "./Steps.tsx";
import Step from "./Step.tsx";

export default Steps;
export { Step };

export interface StepsProps {
  children: unknown;
  vertical?: boolean;
  className?: string;
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" | "neutral";
  variant?: "solid" | "outline" | "ghost" | "dot" | "dashed" | "double" | 
           "gradient-right" | "gradient-left" | "gradient-up" | "gradient-down" | "gradient-middle" |
           "gradient-diagonal" | "gradient-center" | "gradient-cone" | "crystal" | "diagonal-stripes" | "glow" | "minimalist";
}

export interface StepProps {
  icon?:string;
  children: unknown;
  active?: boolean;
  completed?: boolean;
  disabled?: boolean;
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" | "neutral";
  text?: string;
  src?: string;
  svg?: string;
  className?: string;
}
