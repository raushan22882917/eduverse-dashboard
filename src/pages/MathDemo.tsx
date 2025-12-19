import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MathText } from "@/components/MathRenderer";
import { useNavigate } from "react-router-dom";
import {
  Calculator,
  Microscope,
  FlaskConical,
  BookOpen,
  ArrowLeft,
  Lightbulb,
  Target,
  Zap
} from "lucide-react";

const MathDemo = () => {
  const navigate = useNavigate();

  const mathExamples = [
    {
      category: "Algebra",
      icon: Calculator,
      color: "bg-blue-500",
      examples: [
        { label: "Quadratic Formula", math: "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$" },
        { label: "Binomial Theorem", math: "$$(a + b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^k$$" },
        { label: "Logarithm Properties", math: "$$\\log_a(xy) = \\log_a(x) + \\log_a(y)$$" }
      ]
    },
    {
      category: "Calculus",
      icon: Target,
      color: "bg-green-500",
      examples: [
        { label: "Derivative Definition", math: "$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$" },
        { label: "Fundamental Theorem", math: "$$\\int_{a}^{b} f'(x) \\, dx = f(b) - f(a)$$" },
        { label: "Chain Rule", math: "$$\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)$$" }
      ]
    },
    {
      category: "Physics",
      icon: Microscope,
      color: "bg-purple-500",
      examples: [
        { label: "Einstein's Mass-Energy", math: "$$E = mc^2$$" },
        { label: "Newton's Second Law", math: "$$\\vec{F} = m\\vec{a}$$" },
        { label: "Schrödinger Equation", math: "$$i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi$$" }
      ]
    },
    {
      category: "Geometry",
      icon: BookOpen,
      color: "bg-orange-500",
      examples: [
        { label: "Pythagorean Theorem", math: "$$a^2 + b^2 = c^2$$" },
        { label: "Circle Area", math: "$$A = \\pi r^2$$" },
        { label: "Sphere Volume", math: "$$V = \\frac{4}{3}\\pi r^3$$" }
      ]
    },
    {
      category: "Statistics",
      icon: FlaskConical,
      color: "bg-red-500",
      examples: [
        { label: "Normal Distribution", math: "$$f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}$$" },
        { label: "Standard Deviation", math: "$$\\sigma = \\sqrt{\\frac{\\sum_{i=1}^{n}(x_i - \\mu)^2}{n}}$$" },
        { label: "Bayes' Theorem", math: "$$P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}$$" }
      ]
    }
  ];

  const vectorExamples = [
    { label: "Vector Notation", math: "$\\vec{v}$, $\\mathbf{u}$, $\\overrightarrow{AB}$" },
    { label: "Dot Product", math: "$\\vec{a} \\cdot \\vec{b} = |\\vec{a}||\\vec{b}|\\cos\\theta$" },
    { label: "Cross Product", math: "$\\vec{a} \\times \\vec{b} = |\\vec{a}||\\vec{b}|\\sin\\theta \\hat{n}$" },
    { label: "Gradient", math: "$\\nabla f = \\frac{\\partial f}{\\partial x}\\hat{i} + \\frac{\\partial f}{\\partial y}\\hat{j} + \\frac{\\partial f}{\\partial z}\\hat{k}$" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Math Rendering Demo
            </Badge>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
            Mathematical Expressions
          </h1>
          <p className="text-muted-foreground text-lg">
            Properly rendered mathematical notation using KaTeX
          </p>
        </div>

        {/* Vector Examples Highlight */}
        <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Vector Notation Examples</CardTitle>
                <CardDescription>Including your requested vector notation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vectorExamples.map((example, index) => (
                <div key={index} className="p-4 bg-white/50 dark:bg-white/5 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">{example.label}</span>
                  </div>
                  <div className="text-center">
                    <MathText children={example.math} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Math Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {mathExamples.map((category, categoryIndex) => {
            const Icon = category.icon;
            return (
              <Card key={categoryIndex} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className={`${category.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>{category.category}</CardTitle>
                      <CardDescription>{category.examples.length} examples</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.examples.map((example, exampleIndex) => (
                      <div key={exampleIndex} className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{example.label}</span>
                        </div>
                        <div className="text-center">
                          <MathText children={example.math} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Usage Instructions */}
        <Card className="mt-8 border-2 border-green-500/20 bg-gradient-to-r from-green-500/5 to-green-500/10">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-300">How to Use Math Rendering</CardTitle>
            <CardDescription>Implementation details for developers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-white/50 dark:bg-white/5 rounded-lg border">
                <h4 className="font-semibold mb-2">Inline Math</h4>
                <p className="text-sm text-muted-foreground mb-2">Use single dollar signs for inline expressions:</p>
                <code className="text-sm bg-muted p-2 rounded block">
                  {`<MathText children="$\\vec{v}$" />`}
                </code>
              </div>
              
              <div className="p-4 bg-white/50 dark:bg-white/5 rounded-lg border">
                <h4 className="font-semibold mb-2">Block Math</h4>
                <p className="text-sm text-muted-foreground mb-2">Use double dollar signs for block expressions:</p>
                <code className="text-sm bg-muted p-2 rounded block">
                  {`<MathText children="$$x = \\\\frac{-b \\\\pm \\\\sqrt{b^2 - 4ac}}{2a}$$" />`}
                </code>
              </div>

              <div className="p-4 bg-white/50 dark:bg-white/5 rounded-lg border">
                <h4 className="font-semibold mb-2">Special Characters</h4>
                <p className="text-sm text-muted-foreground mb-2">Remember to escape backslashes in JSX strings:</p>
                <ul className="text-sm space-y-1">
                  <li>• <code>\\\\frac</code> for fractions</li>
                  <li>• <code>\\\\vec</code> for vectors</li>
                  <li>• <code>\\\\sqrt</code> for square roots</li>
                  <li>• <code>\\\\int</code> for integrals</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MathDemo;