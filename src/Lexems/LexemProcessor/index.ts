import fs from "fs";

import { LexemProcessorStates } from "../";
import { Types, Operations, KeySymbols, Keywords } from "../../ConstantTypes";

const getNextChar = (file: string, pointer: number) => {
  let newPointer: number = ++pointer;
  return [newPointer, file[newPointer]];
};

const isDigit = (char: string) => {
  return /\d/.test(char)
}

const isEmpty = () => {
  
}

export default (path: string) => {
  const file = fs.readFileSync(path, "utf-8");
  let currentChar: number | string = file[0];
  let state = LexemProcessorStates.Idle;
  let pointer: number | string = 0;
  let buffer = "";

  while (state !== LexemProcessorStates.Final) {
    switch (state) {
      case LexemProcessorStates.Idle: {
        if (pointer + 1 > file.length) {
          state = LexemProcessorStates.Final
          break;
        }

        if (isDigit(currentChar)) {

        }
        break;
      }
    }
  }

  [pointer, currentChar] = getNextChar(file, pointer);

  console.log(pointer);
};
