import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CheckCircle, XCircle, ArrowLeft, Trophy } from '../../components/Icons';
import { translator } from '../../services/translator';
import { useRoleStore } from '../../hooks/useRoleStore';
import { mockQuizQuestions } from '../../services/mockData';

export default function SafetyQuiz() {
  const router = useRouter();
  const { completeModule, updateSafetyScore } = useRoleStore();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const question = mockQuizQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === mockQuizQuestions.length - 1;

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index);
    setShowFeedback(true);
    
    const newAnswers = [...answers, index];
    setAnswers(newAnswers);

    if (index === question.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const finalScore = Math.round((score / mockQuizQuestions.length) * 100);
      updateSafetyScore(finalScore);
      completeModule('quiz');
      
      Alert.alert(
        'Quiz Complete!',
        `Your score: ${score}/${mockQuizQuestions.length} (${finalScore}%)`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-foreground text-lg font-bold">Safety Quiz</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Progress */}
        <View className="mb-6">
          <View className="flex-row justify-between mb-2">
            <Text className="text-neutral-400">
              Question {currentQuestion + 1} of {mockQuizQuestions.length}
            </Text>
            <Text className="text-primary font-bold">
              Score: {score}/{mockQuizQuestions.length}
            </Text>
          </View>
          
          <View className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <View 
              className="h-full bg-primary rounded-full"
              style={{ width: `${((currentQuestion + 1) / mockQuizQuestions.length) * 100}%` }}
            />
          </View>
        </View>

        {/* Question */}
        <View className="bg-neutral-900 rounded-lg border border-border p-6 mb-6">
          <Text className="text-foreground text-xl font-semibold leading-7">
            {question.question}
          </Text>
        </View>

        {/* Options */}
        <View className="space-y-3 mb-6">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correctAnswer;
            const showCorrect = showFeedback && isCorrect;
            const showWrong = showFeedback && isSelected && !isCorrect;

            return (
              <TouchableOpacity
                key={index}
                onPress={() => !showFeedback && handleAnswer(index)}
                disabled={showFeedback}
                className={`p-4 rounded-lg border-2 flex-row items-center justify-between ${
                  showCorrect
                    ? 'bg-accent/20 border-accent'
                    : showWrong
                    ? 'bg-destructive/20 border-destructive'
                    : isSelected
                    ? 'bg-primary/20 border-primary'
                    : 'bg-neutral-900 border-border'
                }`}
              >
                <Text className={`flex-1 ${
                  showCorrect || showWrong ? 'text-foreground font-semibold' : 'text-foreground'
                }`}>
                  {option}
                </Text>
                
                {showCorrect && <CheckCircle size={20} color="#10B981" />}
                {showWrong && <XCircle size={20} color="#EF4444" />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback */}
        {showFeedback && (
          <View className={`p-4 rounded-lg mb-6 ${
            selectedAnswer === question.correctAnswer
              ? 'bg-accent/20 border border-accent'
              : 'bg-destructive/20 border border-destructive'
          }`}>
            <Text className={`font-bold mb-1 ${
              selectedAnswer === question.correctAnswer ? 'text-accent' : 'text-destructive'
            }`}>
              {selectedAnswer === question.correctAnswer ? '✓ Correct!' : '✗ Incorrect'}
            </Text>
            <Text className="text-foreground">
              {selectedAnswer === question.correctAnswer
                ? 'Great job! You got it right.'
                : `The correct answer is: ${question.options[question.correctAnswer]}`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Next Button */}
      {showFeedback && (
        <View className="px-6 py-6">
          <TouchableOpacity
            onPress={handleNext}
            className="bg-primary rounded-lg p-4 items-center"
          >
            <Text className="text-white text-lg font-bold">
              {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
