"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authTestSuite } from "@/lib/auth/auth-test-suite"
import { Loader2, Play, CheckCircle, XCircle, Clock } from "lucide-react"

interface TestResult {
  test: string
  passed: boolean
  error?: string
  duration: number
}

export default function AuthTestPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [report, setReport] = useState<string>("")

  const runTests = async () => {
    setIsRunning(true)
    setResults([])
    setReport("")

    try {
      const testResults = await authTestSuite.runAllTests()
      setResults(testResults)
      setReport(authTestSuite.generateReport())
    } catch (error) {
      console.error("Test execution error:", error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (passed: boolean) => {
    return passed ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (passed: boolean) => {
    return <Badge variant={passed ? "default" : "destructive"}>{passed ? "PASSED" : "FAILED"}</Badge>
  }

  const totalTests = results.length
  const passedTests = results.filter((r) => r.passed).length
  const failedTests = totalTests - passedTests
  const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : "0"

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Authentication System Tests</h1>
          <p className="text-muted-foreground">Comprehensive testing suite for the authentication system</p>
        </div>
        <Button onClick={runTests} disabled={isRunning}>
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run All Tests
            </>
          )}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Passed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{passedTests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{failedTests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{successRate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Detailed results for each authentication test</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${
                    result.passed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.passed)}
                      <div>
                        <h3 className="font-medium">{result.test}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {result.duration}ms
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(result.passed)}
                  </div>
                  {result.error && (
                    <Alert variant="destructive" className="mt-3">
                      <AlertDescription>{result.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Test Report</CardTitle>
            <CardDescription>Comprehensive test report with summary and details</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-x-auto">{report}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
