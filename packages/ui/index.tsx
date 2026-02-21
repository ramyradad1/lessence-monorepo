import React from 'react';

export const tokens = {
  colors: {
    primary: "#f4c025",
    background: {
      light: "#f8f8f5",
      dark: "#181611",
    },
    surface: {
      dark: "#27241b",
      lighter: "#393528",
    },
  },
  fonts: {
    display: ["PlusJakartaSans_400Regular", "sans-serif"],
    sans: ["PlusJakartaSans_400Regular", "sans-serif"],
  },
};

// Basic UI Components
export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'outline' | 'ghost';
    href?: string;
    size?: string;
  }
>(({ className = '', variant = 'default', href, size: _size, children, ...props }, ref) => {
  const baseClass = 'inline-flex items-center justify-center rounded-full font-bold uppercase tracking-widest text-xs px-6 py-3 transition-all disabled:opacity-50';
  const variants: Record<string, string> = {
    default: 'bg-[#f4c025] text-black hover:bg-white',
    outline: 'border border-white/20 text-white hover:bg-white hover:text-black',
    ghost: 'text-white/60 hover:text-white hover:bg-white/5',
  };
  const cls = `${baseClass} ${variants[variant] || variants.default} ${className}`;

  if (href) {
    return <a href={ href } className = { cls } > { children } </a>;
  }
  return <button ref={ ref } className = { cls } {...props}> { children } </button>;
});
Button.displayName = 'Button';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = '', ...props }, ref) => {
  return (
    <input
      ref= { ref }
  className = {`w-full bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#f4c025]/40 transition-colors ${className}`
}
      { ...props }
  />
  );
});
Input.displayName = 'Input';

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className = '', ...props }, ref) => {
  return (
    <label
      ref= { ref }
  className = {`text-xs text-white/40 mb-1 block uppercase tracking-wider ${className}`
}
      { ...props }
  />
  );
});
Label.displayName = 'Label';
