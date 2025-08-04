import { useLocation } from "wouter";
import { 
  ShoppingCart,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  ArrowRight,
  CreditCard,
  Shield,
  Truck,
  RefreshCw,
  Heart,
  Star,
  Gift,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useSiteName } from "@/hooks/use-site-name";

export default function Footer() {
  const [, navigate] = useLocation();
  const siteName = useSiteName();

  // Fetch editor settings for footer data
  const { data: editorSettings } = useQuery({
    queryKey: ["/api/editor-settings"],
    queryFn: async () => {
      const response = await fetch("/api/editor-settings");
      return response.json();
    },
  });

  // Helper function to ensure URL has proper protocol
  const ensureHttpProtocol = (url: string) => {
    if (!url) return '';
    
    // Handle malformed URLs like "https:facebook.com"
    if (url.startsWith('https:') && !url.startsWith('https://')) {
      return url.replace('https:', 'https://');
    }
    if (url.startsWith('http:') && !url.startsWith('http://')) {
      return url.replace('http:', 'http://');
    }
    
    // Check if URL already has proper protocol
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Add https:// if no protocol
    return `https://${url}`;
  };

  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "Categories", href: "/categories" },
    { label: "Deals", href: "/deals" },
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" }
  ];

  const customerService = [
    { label: "Help Center", href: "/help" },
    { label: "Shipping Info", href: "/shipping" },
    { label: "Returns", href: "/returns" },
    { label: "Size Guide", href: "/size-guide" },
    { label: "Track Order", href: "/track-order" },
    { label: "FAQ", href: "/faq" }
  ];

  const myAccount = [
    { label: "Sign In", href: "/auth" },
    { label: "My Dashboard", href: "/dashboard" },
    { label: "Order History", href: "/dashboard?tab=orders" },
    { label: "Wishlist", href: "/wishlist" },
    { label: "Account Settings", href: "/profile" },
    { label: "Notifications", href: "/dashboard?tab=notifications" }
  ];

  const features = [
    {
      icon: Truck,
      title: "Free Shipping",
      description: "On orders over $50"
    },
    {
      icon: RefreshCw,
      title: "Easy Returns",
      description: "30-day return policy"
    },
    {
      icon: Shield,
      title: "Secure Payment",
      description: "100% secure checkout"
    },
    {
      icon: Heart,
      title: "24/7 Support",
      description: "Dedicated customer service"
    }
  ];

  const paymentMethods = [
    { name: "Visa", icon: CreditCard },
    { name: "Mastercard", icon: CreditCard },
    { name: "PayPal", icon: CreditCard },
    { name: "Apple Pay", icon: CreditCard },
    { name: "Google Pay", icon: CreditCard },
    { name: "Stripe", icon: CreditCard }
  ];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Newsletter subscription");
  };

  return (
    <footer className="bg-background border-t">
      {/* Features Section */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              {editorSettings?.siteLogo ? (
                <img 
                  src={editorSettings.siteLogo}
                  alt={siteName}
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                  {siteName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-2xl font-bold text-foreground">{siteName}</span>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Your ultimate destination for quality products and exceptional shopping experience.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              {editorSettings?.footerAddress && (
                <div className="flex items-center space-x-3 text-sm">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{editorSettings.footerAddress}</span>
                </div>
              )}
              {editorSettings?.footerPhone && (
                <div className="flex items-center space-x-3 text-sm">
                  <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{editorSettings.footerPhone}</span>
                </div>
              )}
              {editorSettings?.footerEmail && (
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{editorSettings.footerEmail}</span>
                </div>
              )}
              {/* Default fallback contact info when editor settings are not available */}
              {!editorSettings && (
                <>
                  <div className="flex items-center space-x-3 text-sm">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">123 Commerce Street, Shopping District, NY 10001</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">support@shopflow.com</span>
                  </div>
                </>
              )}
            </div>

            {/* Social Media */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Follow Us</h4>
              <div className="flex space-x-3">
                {/* Dynamic social links from editor settings */}
                {editorSettings?.facebookLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 hover:bg-primary hover:text-primary-foreground"
                    onClick={() => window.open(ensureHttpProtocol(editorSettings.facebookLink), '_blank')}
                    aria-label="Facebook"
                  >
                    <Facebook className="h-4 w-4" />
                  </Button>
                )}
                {editorSettings?.twitterLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 hover:bg-primary hover:text-primary-foreground"
                    onClick={() => window.open(ensureHttpProtocol(editorSettings.twitterLink), '_blank')}
                    aria-label="Twitter"
                  >
                    <Twitter className="h-4 w-4" />
                  </Button>
                )}
                {editorSettings?.instagramLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 hover:bg-primary hover:text-primary-foreground"
                    onClick={() => window.open(ensureHttpProtocol(editorSettings.instagramLink), '_blank')}
                    aria-label="Instagram"
                  >
                    <Instagram className="h-4 w-4" />
                  </Button>
                )}
                {editorSettings?.linkedinLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 hover:bg-primary hover:text-primary-foreground"
                    onClick={() => window.open(ensureHttpProtocol(editorSettings.linkedinLink), '_blank')}
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                )}
                {/* Default fallback social media when editor settings are not available */}
                {!editorSettings && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0 hover:bg-primary hover:text-primary-foreground"
                      onClick={() => window.open("#", '_blank')}
                      aria-label="Facebook"
                    >
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0 hover:bg-primary hover:text-primary-foreground"
                      onClick={() => window.open("#", '_blank')}
                      aria-label="Twitter"
                    >
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0 hover:bg-primary hover:text-primary-foreground"
                      onClick={() => window.open("#", '_blank')}
                      aria-label="Instagram"
                    >
                      <Instagram className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0 hover:bg-primary hover:text-primary-foreground"
                      onClick={() => window.open("#", '_blank')}
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center">
              <Package className="h-4 w-4 mr-2 text-primary" />
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => navigate(link.href)}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center">
              <Heart className="h-4 w-4 mr-2 text-primary" />
              Customer Service
            </h3>
            <ul className="space-y-3">
              {customerService.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => navigate(link.href)}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* My Account */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center">
              <Star className="h-4 w-4 mr-2 text-primary" />
              My Account
            </h3>
            <ul className="space-y-3">
              {myAccount.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => navigate(link.href)}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-1">
            <h3 className="font-semibold text-foreground mb-4 flex items-center">
              <Gift className="h-4 w-4 mr-2 text-primary" />
              Newsletter
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Subscribe for exclusive deals and new arrivals.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <div className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="flex-1"
                  required
                />
                <Button type="submit" size="sm" className="px-3">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                © 2025 ShopFlow. All rights reserved.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-sm text-muted-foreground">We accept:</span>
              <div className="flex items-center space-x-2 flex-wrap justify-center sm:justify-start">
                {paymentMethods.map((method, index) => (
                  <div
                    key={index}
                    className="h-8 w-12 bg-muted dark:bg-gray-700 rounded flex items-center justify-center border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    title={method.name}
                  >
                    <method.icon className="h-4 w-4 text-muted-foreground dark:text-gray-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}