const fs = require('fs');
const path = require('path');

const rawText = `1. في سياق النص، كلمة الضغوط تدل على:
A) الأمراض الجسدية
B) الأعباء النفسية والحياتية
C) التمارين الرياضية
D) السفر الطويل

2. الفرق بين هواية و وظيفة أن الهواية:
A) مصدر رزق
B) نشاط اختياري في وقت الفراغ
C) عمل رسمي
D) التزام إجباري

مفتاح الإجابة

1 B
2 B`;

const answerMap = {};
// Allows formats like "1-A", "1: A", "1A", or "1 A"
const answerRegex = /(?:^|\s)(\d+)\s*[-:=.]?\s*([A-Da-d])(?=$|\s|,|<br>)/gi;
let match;

while ((match = answerRegex.exec(rawText)) !== null) {
    answerMap[parseInt(match[1])] = match[2].toUpperCase();
}

const cleanedText = rawText.replace(/(?:javoblar|kalitlar|javoblar kaliti|مفتاح الإجابة|answers|keys)\s*:?[\s\S]*/i, '');

const questionRegex = /(?:^|\n)\s*(\d+)[\.\)]\s+([\s\S]*?)(?=(?:(?:^|\n)\s*\d+[\.\)]\s+)|$)/g;
const questions = [];

while ((match = questionRegex.exec(cleanedText)) !== null) {
    let qNum = parseInt(match[1]);
    let block = match[2].trim();

    const optRegex = /(?:^|\s)([A-Da-d])[\.\)]\s*([\s\S]*?)(?=(?:(?:^|\s)[A-Da-d][\.\)]\s*)|$)/g;
    let optMatch;
    let optionsMap = {};
    let questionText = block;
    let hasOptions = false;

    while ((optMatch = optRegex.exec(block)) !== null) {
        if (!hasOptions) {
            questionText = block.substring(0, optMatch.index).trim();
        }
        hasOptions = true;
        optionsMap[optMatch[1].toUpperCase()] = optMatch[2].trim();
    }

    let optionsArr = [
        optionsMap['A'] || 'A varianti',
        optionsMap['B'] || 'B varianti',
        optionsMap['C'] || 'C varianti',
        optionsMap['D'] || 'D varianti',
    ];

    let correctOption = 0;
    if (answerMap[qNum]) {
        const idx = ['A', 'B', 'C', 'D'].indexOf(answerMap[qNum]);
        if (idx !== -1) correctOption = idx;
    }

    if (questionText && questionText.length > 2) {
        questions.push({
            id: Date.now() + qNum,
            text: questionText,
            options: optionsArr,
            correctOption: correctOption
        });
    }
}

console.log(JSON.stringify({ questions, answerMap }, null, 2));
