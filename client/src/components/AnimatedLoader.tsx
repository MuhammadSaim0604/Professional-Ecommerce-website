import { Loader2, ShoppingBag, Package, Sparkles } from "lucide-react";

interface AnimatedLoaderProps {
  text?: string;
  variant?: 'default' | 'products' | 'cart';
  size?: 'sm' | 'md' | 'lg';
}

export function AnimatedLoader({ 
  text = "Loading...", 
  variant = 'default',
  size = 'md'
}: AnimatedLoaderProps) {
  const getIcon = () => {
    switch (variant) {
      case 'products':
        return <Package className={`animate-spin ${getSizeClass()}`} />;
      case 'cart':
        return <ShoppingBag className={`animate-spin ${getSizeClass()}`} />;
      default:
        return <Loader2 className={`animate-spin ${getSizeClass()}`} />;
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-8 w-8';
      default:
        return 'h-6 w-6';
    }
  };

  const getContainerClass = () => {
    switch (size) {
      case 'sm':
        return 'py-2';
      case 'lg':
        return 'py-8';
      default:
        return 'py-4';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${getContainerClass()}`}>
      <div className="relative">
        {getIcon()}
        <div className="absolute -top-1 -right-1 animate-pulse">
          <Sparkles className="h-3 w-3 text-blue-500" />
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 font-medium animate-pulse">
        {text}
      </p>
    </div>
  );
}

export function ProductsLoader() {
  return (
    <div className="w-full py-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-blue-400 opacity-20"></div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
            Loading More Products
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Fetching amazing deals just for you...
          </p>
        </div>
        <div className="flex space-x-1">
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}