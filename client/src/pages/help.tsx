import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Help Center</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    How do I track my order?
                  </AccordionTrigger>
                  <AccordionContent>
                    You can track your order by visiting your dashboard and
                    clicking on "My Orders".
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    What payment methods do you accept?
                  </AccordionTrigger>
                  <AccordionContent>
                    We accept EasyPaisa, JazzCash, and Cash on Delivery.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    How long does shipping take?
                  </AccordionTrigger>
                  <AccordionContent>
                    Standard shipping takes 3-5 business days within Pakistan.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">Customer Support</h3>
                <p className="text-muted-foreground">
                  Email: support@shopflow.com
                </p>
                <p className="text-muted-foreground">
                  Phone: +92 300 1234567
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Business Hours</h3>
                <p className="text-muted-foreground">
                  Monday - Friday: 9 AM - 6 PM
                </p>
                <p className="text-muted-foreground">
                  Saturday: 10 AM - 4 PM
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
