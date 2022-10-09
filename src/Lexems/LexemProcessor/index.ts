import fs from "fs";

import { LexemProcessorStates } from "../";
import {
  Types,
  Operations,
  KeySymbols,
  Keywords,
  IType,
} from "../../ConstantTypes";

type IGetChar = (
  file: string,
  pointer: number
) => [newPointer: number, newCurrentChar: string];

interface ILexemTypes {
  ParsingError: -1;
  DataType: 0;
  Variable: 1;
  Delimeter: 2;
  Identifier: 3;
  Constant: 4;
  Operation: 5;
}

const LexemTypes: ILexemTypes = {
  ParsingError: -1,
  DataType: 0,
  Variable: 1,
  Delimeter: 2,
  Identifier: 3,
  Constant: 4,
  Operation: 5,
};

interface ILexemsArray {
  type: number;
  lexem: string;
  value: number;
}

interface IVariablesArray {
  id: number;
  dataType: string;
  name: string;
}

export default (path: string) => {
  const file = fs.readFileSync(path, "utf-8");
  let currentChar: string = file[0];
  let state = LexemProcessorStates.Idle;
  let pointer: number = 0;
  let variablesCount = 0;
  let buffer = "";
  let seekingBuffer = "";
  let variables: IVariablesArray[] = [];
  let lexems: ILexemsArray[] = [];

  const getNextChar: IGetChar = (file: string, pointer: number) => {
    let newPointer: number = ++pointer;
    return [newPointer, file[newPointer]];
  };

  const SearchInLexemDictionary = (buffer: string) => {
    const res: string | undefined = Keywords.find((value) => value === buffer);

    if (res) {
      return res;
    }
    return null;
  };

  const SearchInTypesDictionary = (buffer: string) => {
    const res: IType | undefined = Types.find((value) => value.type === buffer);

    if (res) {
      return res;
    }
    return null;
  };

  const addLexem = (lexemType: number, id: number, comment: string) => {
    lexems.push({ type: lexemType, lexem: comment, value: id });
  };

  const isDigit = (char: string) => {
    return /\d/.test(char);
  };

  const isLetter = (char: string) => {
    return char.match(/[a-z]/i);
  };

  const isEmptyOrNextLine = (char: string) => {
    return (
      char === " " ||
      char === "\n" ||
      char === "\t" ||
      char === "\0" ||
      char === "\r"
    );
  };

  const clearBuffer = () => {
    buffer = "";
    seekingBuffer = "";
  };

  const addToBuffer = (str: string) => {
    buffer += str;
  };

  const searchInDelimeterDictionary = () => {
    const result = KeySymbols.indexOf(buffer);
    if (result) {
      return result;
    }
    return -1;
  };

  const searchInOperationsDictionary = () => {
    const result = Operations.find((item) => item.type === buffer);
    if (result) {
      return result;
    }

    return -1;
  };

  const searchNextInOperationsDictionary = () => {
    const result = Operations.find(
      (item) => item.type === buffer + file[pointer]
    );
    if (result) {
      return result;
    }

    return -1;
  };

  while (state !== LexemProcessorStates.Final) {
    switch (state) {
      case LexemProcessorStates.Idle: {
        if (pointer + 1 > file.length) {
          state = LexemProcessorStates.Final;
          break;
        }

        if (isEmptyOrNextLine(currentChar)) {
          [pointer, currentChar] = getNextChar(file, pointer);
        } else if (isDigit(currentChar)) {
          clearBuffer();
          addToBuffer(currentChar);
          state = LexemProcessorStates.ReadingNum;
          [pointer, currentChar] = getNextChar(file, pointer);
        } else if (isLetter(currentChar)) {
          clearBuffer();
          addToBuffer(currentChar);
          state = LexemProcessorStates.ReadingIdentifier;
          [pointer, currentChar] = getNextChar(file, pointer);
        } else {
          state = LexemProcessorStates.Delimeter;
          addToBuffer(currentChar);
          [pointer, currentChar] = getNextChar(file, pointer);
        }
        break;
      }
      case LexemProcessorStates.ReadingIdentifier: {
        if (isLetter(currentChar) || isDigit(currentChar)) {
          addToBuffer(currentChar);
          [pointer, currentChar] = getNextChar(file, pointer);
        } else {
          let lexemRef: string | null = SearchInLexemDictionary(buffer);
          let typeRef: IType | null = SearchInTypesDictionary(buffer);
          if (lexemRef) {
            addLexem(LexemTypes.Identifier, 0, lexemRef);
            clearBuffer();
          } else if (typeRef) {
            addLexem(
              LexemTypes.DataType,
              typeRef.attributes.id,
              typeRef.attributes.comment
            );
            clearBuffer();
          } else {
            let variable = variables.find((item) => item.name === buffer);

            if (!variable) {
              let variableType = lexems[lexems.length - 1];
              if (variableType.type !== LexemTypes.DataType) {
                state = LexemProcessorStates.Final;
                break;
              }
              variablesCount += 1;
              variables.push({
                id: variablesCount,
                dataType: variableType.lexem,
                name: buffer,
              });
              lexems.push({
                type: LexemTypes.Variable,
                value: variablesCount,
                lexem: `variable <${buffer}> of type <${variableType.type}>`,
              });
              clearBuffer();
            } else {
              lexems.push({
                type: LexemTypes.Variable,
                value: variables.find((item) => item.name === buffer)?.id || -1,
                lexem: `variable <${buffer}>`,
              });
              clearBuffer();
            }
          }
          state = LexemProcessorStates.Idle;
        }
        break;
      }

      case LexemProcessorStates.ReadingNum: {
        if (isDigit(currentChar)) {
          addToBuffer(currentChar);
          [pointer, currentChar] = getNextChar(file, pointer);
        } else {
          addLexem(
            LexemTypes.Constant,
            +buffer,
            `integer with value = ${buffer}`
          );
          clearBuffer();
          state = LexemProcessorStates.Idle;
        }
        break;
      }

      case LexemProcessorStates.Delimeter: {
        const searchKeyResult = searchInDelimeterDictionary();
        const searchOperatorsResult = searchInOperationsDictionary();

        if (searchKeyResult !== -1) {
          addLexem(LexemTypes.Delimeter, searchKeyResult, buffer);
          state = LexemProcessorStates.Idle;
          clearBuffer();
        } else if (searchOperatorsResult !== -1) {
          const nextOperator = searchNextInOperationsDictionary();

          if (nextOperator !== -1) {
            [pointer, currentChar] = getNextChar(file, pointer);
            addToBuffer(currentChar);
            addLexem(
              LexemTypes.Operation,
              nextOperator.attributes.id,
              nextOperator.attributes.comment
            );
            state = LexemProcessorStates.Idle;

            clearBuffer();
          } else {
            addLexem(
              LexemTypes.Operation,
              searchOperatorsResult.attributes.id,
              searchOperatorsResult.attributes.comment
            );
            state = LexemProcessorStates.Idle;
            clearBuffer();
          }
        } else {
          addLexem(
            LexemTypes.ParsingError,
            -1,
            `Error at ${pointer}: Could not parse ${buffer}!`
          );
          state = LexemProcessorStates.Error;
        }
        break;
      }

      case LexemProcessorStates.Error: {
        state = LexemProcessorStates.Final;
        break;
      }

      case LexemProcessorStates.Final: {
        break;
      }
    }
  }
  return {
    lexems,
    variables,
  };
};
