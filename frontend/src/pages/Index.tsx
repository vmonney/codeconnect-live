import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Code2, 
  Video, 
  MessageSquare, 
  Play, 
  Zap,
  Shield,
  Globe,
  ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: Code2,
    title: 'Monaco Code Editor',
    description: 'Syntax highlighting, auto-completion, and real-time collaborative editing.',
  },
  {
    icon: Video,
    title: 'Video Conferencing',
    description: 'Built-in video/audio calls with screen sharing capabilities.',
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Real-time messaging with typing indicators and timestamps.',
  },
  {
    icon: Zap,
    title: 'Instant Execution',
    description: 'Run code in multiple languages with instant output feedback.',
  },
  {
    icon: Shield,
    title: 'Secure Sessions',
    description: 'Private interview rooms with unique, shareable links.',
  },
  {
    icon: Globe,
    title: 'Multi-Language',
    description: 'Support for JavaScript and Python with browser-based WASM execution.',
  },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="container relative z-10 px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Technical Interviews,{' '}
              <span className="gradient-text">Simplified</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              A collaborative coding interview platform with real-time editing, 
              video calls, and instant code execution.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="glow" size="xl" asChild>
                <Link to="/auth?mode=signup">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/demo">
                  <Play className="mr-2 h-5 w-5" />
                  Try Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground">
              A complete toolkit for modern technical interviews.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature) => (
              <Card 
                key={feature.title} 
                className="group hover:border-primary/50 transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Code2 className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold">
                Code<span className="text-primary">View</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/demo" className="hover:text-foreground transition-colors">Demo</Link>
              <Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
            </div>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
