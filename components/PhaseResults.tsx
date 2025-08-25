'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Users, Target, AlertTriangle, FileText, Database, Code, Palette } from 'lucide-react';
import { PlanningPhase, AnalysisPhase, DesignPhase } from '@/types/project';

interface PhaseResultsProps {
  planning: PlanningPhase;
  analysis: AnalysisPhase;
  design: DesignPhase;
}

export default function PhaseResults({ planning, analysis, design }: PhaseResultsProps) {
  const renderListSection = (title: string, items: any, icon: React.ReactNode, color: string) => {
    const safeItems: string[] = Array.isArray(items)
      ? items
      : items == null
        ? []
        : typeof items === 'string'
          ? items.split(/\n+|;+/).map(s => s.trim()).filter(Boolean)
          : Object.values(items).map(v => String(v));
    return (
    <div className="space-y-3">
      <h4 className="font-semibold flex items-center gap-2 text-gray-900">
        {icon}
        {title}
      </h4>
      <div className="space-y-2">
        {safeItems.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className={`w-2 h-2 rounded-full ${color} mt-2 flex-shrink-0`}></div>
            <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </div>
  ); };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Waterfall Methodology Results</h2>
        <p className="text-gray-600">Comprehensive analysis across all three phases</p>
      </div>

      <Tabs defaultValue="planning" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="planning" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="design" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Design
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planning">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Planning Phase Results
                </CardTitle>
                <CardDescription>
                  Project scope, objectives, and strategic planning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {renderListSection(
                      'Project Scope',
                      planning.scope,
                      <Target className="w-4 h-4" />,
                      'bg-blue-500'
                    )}
                    {renderListSection(
                      'Key Objectives',
                      planning.objectives,
                      <Target className="w-4 h-4" />,
                      'bg-green-500'
                    )}
                    {renderListSection(
                      'Stakeholders',
                      planning.stakeholders,
                      <Users className="w-4 h-4" />,
                      'bg-purple-500'
                    )}
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2 text-gray-900">
                        <Clock className="w-4 h-4" />
                        Timeline Estimate
                      </h4>
                      <Badge variant="outline" className="text-sm px-3 py-1">
                        {planning.timeline}
                      </Badge>
                    </div>
                    {renderListSection(
                      'Required Resources',
                      planning.resources,
                      <Database className="w-4 h-4" />,
                      'bg-orange-500'
                    )}
                    {renderListSection(
                      'Risk Assessment',
                      planning.risks,
                      <AlertTriangle className="w-4 h-4" />,
                      'bg-red-500'
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-500" />
                  Analysis Phase Results
                </CardTitle>
                <CardDescription>
                  Requirements gathering and system analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {renderListSection(
                      'Functional Requirements',
                      analysis.functionalRequirements,
                      <Code className="w-4 h-4" />,
                      'bg-blue-500'
                    )}
                    {renderListSection(
                      'User Stories',
                      analysis.userStories,
                      <Users className="w-4 h-4" />,
                      'bg-purple-500'
                    )}
                  </div>
                  <div className="space-y-6">
                    {renderListSection(
                      'Non-Functional Requirements',
                      analysis.nonFunctionalRequirements,
                      <AlertTriangle className="w-4 h-4" />,
                      'bg-orange-500'
                    )}
                    {renderListSection(
                      'System Constraints',
                      analysis.constraints,
                      <Database className="w-4 h-4" />,
                      'bg-red-500'
                    )}
                    {renderListSection(
                      'External Integrations',
                      analysis.integrations,
                      <Target className="w-4 h-4" />,
                      'bg-green-500'
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="design">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-500" />
                  Design Phase Results
                </CardTitle>
                <CardDescription>
                  System architecture and technical design
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {renderListSection(
                      'System Architecture',
                      design.systemArchitecture,
                      <Database className="w-4 h-4" />,
                      'bg-blue-500'
                    )}
                    {renderListSection(
                      'Database Schema',
                      design.databaseSchema,
                      <Database className="w-4 h-4" />,
                      'bg-green-500'
                    )}
                    {renderListSection(
                      'API Design',
                      design.apiEndpoints,
                      <Code className="w-4 h-4" />,
                      'bg-purple-500'
                    )}
                  </div>
                  <div className="space-y-6">
                    {renderListSection(
                      'UI/UX Design',
                      design.uiDesign,
                      <Palette className="w-4 h-4" />,
                      'bg-orange-500'
                    )}
                    {renderListSection(
                      'Coding Standards',
                      design.codingStandards,
                      <Code className="w-4 h-4" />,
                      'bg-red-500'
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}