'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { ProjectInput } from '@/types/project';

interface ProjectInputFormProps {
  onSubmit: (projectInput: ProjectInput) => void;
}

const commonTechStacks = {
  Frontend: ['React', 'Vue.js', 'Angular', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Material-UI', 'Bootstrap'],
  Backend: ['Node.js', 'Python', 'Java', 'C#', 'Go', 'Ruby', 'PHP', 'Express.js', 'Django', 'Spring Boot'],
  'Full Stack': ['React', 'Node.js', 'Next.js', 'TypeScript', 'MongoDB', 'PostgreSQL', 'Firebase', 'Supabase'],
  Database: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Firebase', 'Supabase', 'DynamoDB'],
  Cloud: ['AWS', 'Google Cloud', 'Azure', 'Vercel', 'Netlify', 'Railway', 'Docker', 'Kubernetes'],
};

export default function ProjectInputForm({ onSubmit }: ProjectInputFormProps) {
  const [formData, setFormData] = useState<Partial<ProjectInput>>({
    projectType: undefined,
    techStack: [],
  });
  const [customTech, setCustomTech] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.projectType) {
      return;
    }
    onSubmit(formData as ProjectInput);
  };

  const addTechnology = (tech: string) => {
    if (tech && !formData.techStack?.includes(tech)) {
      setFormData(prev => ({
        ...prev,
        techStack: [...(prev.techStack || []), tech]
      }));
    }
  };

  const removeTechnology = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack?.filter(t => t !== tech) || []
    }));
  };

  const addCustomTechnology = () => {
    if (customTech.trim()) {
      addTechnology(customTech.trim());
      setCustomTech('');
    }
  };

  const isFormValid = formData.title && formData.description && formData.projectType;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Tell us about your project idea</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              placeholder="e.g., E-commerce Platform, Task Management App"
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Project Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide a detailed explanation of what you want to build, including key features and functionality..."
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 min-h-[120px]"
            />
          </div>

          <div>
            <Label htmlFor="projectType">Project Type *</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, projectType: value as any }))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Frontend">Frontend Only</SelectItem>
                <SelectItem value="Backend">Backend Only</SelectItem>
                <SelectItem value="Full Stack">Full Stack Application</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Technology Stack */}
      <Card>
        <CardHeader>
          <CardTitle>Technology Stack</CardTitle>
          <CardDescription>Choose your preferred technologies or let us suggest based on your project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Technologies */}
          {formData.techStack && formData.techStack.length > 0 && (
            <div>
              <Label>Selected Technologies</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.techStack.map((tech) => (
                  <Badge key={tech} variant="secondary" className="gap-1">
                    {tech}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeTechnology(tech)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Technology Categories */}
          {formData.projectType && (
            <div className="space-y-4">
              {Object.entries(commonTechStacks).map(([category, technologies]) => (
                <div key={category}>
                  <Label className="text-sm font-medium">{category}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {technologies.map((tech) => (
                      <Button
                        key={tech}
                        type="button"
                        variant={formData.techStack?.includes(tech) ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          formData.techStack?.includes(tech)
                            ? removeTechnology(tech)
                            : addTechnology(tech)
                        }
                        className="text-xs"
                      >
                        {tech}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Custom Technology */}
          <div>
            <Label htmlFor="customTech">Add Custom Technology</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="customTech"
                placeholder="Enter technology name"
                value={customTech}
                onChange={(e) => setCustomTech(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTechnology())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomTechnology}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Details */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
          <CardDescription>Help us better understand your project requirements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="targetUsers">Target Users</Label>
            <Textarea
              id="targetUsers"
              placeholder="Describe who will use this application (e.g., small business owners, students, general public)"
              value={formData.targetUsers || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, targetUsers: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timeline">Preferred Timeline</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, timeline: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                  <SelectItem value="1 month">1 month</SelectItem>
                  <SelectItem value="2-3 months">2-3 months</SelectItem>
                  <SelectItem value="3-6 months">3-6 months</SelectItem>
                  <SelectItem value="6+ months">6+ months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="budget">Budget Range</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$0">$0</SelectItem>
                  <SelectItem value="Under $1K">Under $1K</SelectItem>
                  <SelectItem value="$1K - $5K">$1K - $5K</SelectItem>
                  <SelectItem value="$5K - $10K">$5K - $10K</SelectItem>
                  <SelectItem value="$10K - $25K">$10K - $25K</SelectItem>
                  <SelectItem value="$25K+">$25K+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="specificRequirements">Specific Requirements</Label>
            <Textarea
              id="specificRequirements"
              placeholder="Any specific features, integrations, or technical requirements you want to include"
              value={formData.specificRequirements || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, specificRequirements: e.target.value }))}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button
          type="submit"
          disabled={!isFormValid}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-2"
        >
          Generate Project Plan
        </Button>
      </div>
    </form>
  );
}