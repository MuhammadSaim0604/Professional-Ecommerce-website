
import { Header } from "@/components/layout/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Clock, Package, MapPin } from "lucide-react";

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Shipping Information</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Shipping Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">Standard Shipping</h3>
                  <p className="text-muted-foreground">3-5 business days</p>
                  <p className="text-muted-foreground">Rs. 150 (Free on orders over Rs. 5000)</p>
                </div>
                <div>
                  <h3 className="font-semibold">Express Shipping</h3>
                  <p className="text-muted-foreground">1-2 business days</p>
                  <p className="text-muted-foreground">Rs. 300</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Coverage Areas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>We deliver to all major cities in Pakistan:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Karachi</li>
                  <li>Lahore</li>
                  <li>Islamabad</li>
                  <li>Rawalpindi</li>
                  <li>Faisalabad</li>
                  <li>And many more...</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Shipping Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <ul className="space-y-2">
                <li>All orders are processed within 1-2 business days</li>
                <li>Shipping costs are calculated based on weight and destination</li>
                <li>Free shipping on orders over Rs. 5000</li>
                <li>We use reliable courier services for safe delivery</li>
                <li>Tracking information will be provided once your order ships</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
