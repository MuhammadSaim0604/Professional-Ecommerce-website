
import { Header } from "@/components/layout/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Clock, Shield, CheckCircle } from "lucide-react";

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Returns & Exchanges</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Return Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">30-Day Returns</h3>
                    <p className="text-muted-foreground">You have 30 days from delivery to return items</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Original Condition</h3>
                    <p className="text-muted-foreground">Items must be unused and in original packaging</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Easy Process</h3>
                    <p className="text-muted-foreground">Simple return process with prepaid labels</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>How to Return</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Contact our customer service</li>
                  <li>Receive return authorization and label</li>
                  <li>Pack items securely in original packaging</li>
                  <li>Attach the return label</li>
                  <li>Drop off at courier location</li>
                  <li>Receive refund within 5-7 business days</li>
                </ol>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Return Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <h3>Eligible for Return:</h3>
                <ul className="space-y-1">
                  <li>Defective or damaged items</li>
                  <li>Wrong item received</li>
                  <li>Items not as described</li>
                  <li>Change of mind (within 30 days)</li>
                </ul>
                
                <h3 className="mt-6">Not Eligible for Return:</h3>
                <ul className="space-y-1">
                  <li>Used or worn items</li>
                  <li>Items without original tags</li>
                  <li>Personalized or custom items</li>
                  <li>Hygiene-sensitive products</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
