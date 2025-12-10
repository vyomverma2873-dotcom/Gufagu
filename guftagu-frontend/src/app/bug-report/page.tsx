'use client';

import { Bug, Send } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';

export default function BugReportPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps: '',
    expected: '',
    actual: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Bug report submitted:', formData);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Bug className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">Report a Bug</h1>
          <p className="text-xl text-neutral-400">
            Help us improve by reporting issues you encounter
          </p>
        </div>

        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Bug Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-800/60 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="Brief description of the bug"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-neutral-800/60 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                placeholder="Detailed description of the bug"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Steps to Reproduce</label>
              <textarea
                value={formData.steps}
                onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-neutral-800/60 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Expected Behavior</label>
                <textarea
                  value={formData.expected}
                  onChange={(e) => setFormData({ ...formData, expected: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-neutral-800/60 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                  placeholder="What should happen"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Actual Behavior</label>
                <textarea
                  value={formData.actual}
                  onChange={(e) => setFormData({ ...formData, actual: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-neutral-800/60 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                  placeholder="What actually happens"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              <Send className="w-4 h-4 mr-2" />
              Submit Bug Report
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
