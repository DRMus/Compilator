interface ILexemStates {
  readonly Idle: number;
  readonly ReadingNum: number;
  readonly Delimeter: number;
  readonly Completed: number;
  readonly ReadingIdentifier: number;
  readonly Assign: number;
  readonly Error: number;
  readonly Final: number;
  readonly ScopeOpened: number;
  readonly ScopeClosed: number;
}

const LexemProcessorStates: ILexemStates = {
  Idle: 1,
  ReadingNum: 2,
  Delimeter: 3,
  Completed: 4,
  ReadingIdentifier: 5,
  Assign: 6,
  Error: 7,
  Final: 8,
  ScopeOpened: 9,
  ScopeClosed: 10,
};

export default LexemProcessorStates;
