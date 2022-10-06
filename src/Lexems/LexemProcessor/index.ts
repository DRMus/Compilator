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
      char == " " ||
      char == "\n" ||
      char == "\t" ||
      char == "\0" ||
      char == "\r"
    );
  };

  const clearBuffer = () => {
    buffer = "";
    seekingBuffer = "";
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
          buffer += currentChar;
          state = LexemProcessorStates.ReadingNum;
          [pointer, currentChar] = getNextChar(file, pointer);
        } else if (isLetter(currentChar)) {
          clearBuffer();
          buffer += currentChar;
          state = LexemProcessorStates.ReadingIdentifier;
          [pointer, currentChar] = getNextChar(file, pointer);
        } else {
          state = LexemProcessorStates.Delimeter;
          buffer += currentChar;
          [pointer, currentChar] = getNextChar(file, pointer);
        }
        break;
      }
      case LexemProcessorStates.ReadingIdentifier: {
        if (isLetter(currentChar) || isDigit(currentChar)) {
          buffer += currentChar;
          [pointer, currentChar] = getNextChar(file, pointer);
        } else {
          let lexemRef: string | null = SearchInLexemDictionary(buffer);
          let typeRef: IType | null = SearchInTypesDictionary(buffer);
          if (lexemRef) {
            addLexem(LexemTypes.Identifier, 0, lexemRef);
            clearBuffer();
          } else if (typeRef) {
            addLexem(
              LexemTypes.Identifier,
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
            }
          }
          state = LexemProcessorStates.Idle;
        }
        break;
      }
    }
  }
};
