import { useNavigate } from 'react-router-dom';
import { MapPin, Car, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const navigate = useNavigate();

  const steps = [
    {
      icon: MapPin,
      title: 'Select Your Station',
      description: 'Choose your metro station and destination area',
    },
    {
      icon: Car,
      title: 'Get Matched',
      description: 'We connect you with drivers heading your way',
    },
    {
      icon: CheckCircle,
      title: 'Share the Ride',
      description: 'Complete your last-mile journey together',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          Your Last Mile,{' '}
          <span className="text-primary">Made Simple</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect with fellow commuters for shared rides from metro stations to your destination
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>I'm a Rider</CardTitle>
              <CardDescription>
                Find rides from your metro station to your destination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/rider')}
                className="w-full"
              >
                Request a Ride
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-accent">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Car className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>I'm a Driver</CardTitle>
              <CardDescription>
                Offer rides and share your commute with others
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/driver')}
                variant="outline"
                className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                Register Route
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <step.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/4 left-1/2 w-24 border-t-2 border-dashed border-muted-foreground/30" />
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
