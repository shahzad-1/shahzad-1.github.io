export class Report {
  id: number;
  questions: Question[];
}

class Question {
  id: number;
  title: string;
  input: Input;
  value?: string;
}

class Input {
  type: InputType;
  properties: any;
}

export enum InputType {
  Input = 'input',
  Select = 'select',
  Radio = 'radio'
}
