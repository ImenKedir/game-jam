'use client';
import p5 from 'p5';
import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNotch, faWarning } from '@fortawesome/free-solid-svg-icons';

type P5SketchFn = (p: p5) => void;
type P5 = (p: any) => { setup: () => void; draw: () => void };

export interface P5SketchProps {
  sketch: string | P5;
}

export function P5Sketch({ sketch }: P5SketchProps) {
  const p5Instance = useRef<p5 | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
        p5Instance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    try {
      let sketchFn: P5SketchFn;

      if (typeof sketch === 'string') {
        // ROBUST VALIDATION STRATEGY
        
        // 1. Check for basic structure requirements
        if (!sketch.includes('return function(p)')) {
          console.warn('Missing p5 function format - attempting to repair');
          if (sketch.includes('function setup()') && !sketch.includes('return function(p)')) {
            // Wrap loose p5 code in proper function wrapper
            sketch = `return function(p) {\n${sketch}\n}`;
          } else {
            throw new Error('Invalid sketch: Missing p5 function format and cannot be repaired');
          }
        }
        
        // 2. Enhanced brace balancing with structure analysis
        try {
          // Count all braces to check balance
          const openBraces = (sketch.match(/\{/g) || []).length;
          const closeBraces = (sketch.match(/\}/g) || []).length;
          
          // Add explicit debug logging
          console.log(`Code structure check: ${openBraces} opening braces, ${closeBraces} closing braces`);
          
          // 3. Fix unbalanced braces
          if (openBraces > closeBraces) {
            console.warn('Detected incomplete code with missing closing braces - repairing');
            const missingBraces = openBraces - closeBraces;
            
            // Add closing braces with proper indentation for readability
            let repair = '';
            for (let i = 0; i < missingBraces; i++) {
              repair += '\n' + '  '.repeat(missingBraces - i - 1) + '}';
            }
            sketch = sketch + repair;
            
            console.log('Repaired code by adding missing braces:', repair);
          } else if (closeBraces > openBraces) {
            console.warn('Unusual code with extra closing braces - attempt repair');
            // Try to remove extra closing braces from the end
            const extraBraces = closeBraces - openBraces;
            const pattern = new RegExp(`\\}{${extraBraces}}$`);
            sketch = sketch.replace(pattern, '}');
          }
          
          // 4. Additional safety: Check for specific p5.js required functions
          const hasFunctions = sketch.includes('p.setup') && sketch.includes('p.draw');
          if (!hasFunctions) {
            console.warn('Potentially incomplete p5.js code: Missing setup or draw functions');
          }
          
          // 5. Check if code ends properly (handle potential truncation)
          if (!sketch.trim().endsWith('}')) {
            console.warn('Code appears to be truncated - adding closing brace');
            sketch = sketch + '\n}';
          }
        } catch (error) {
          console.error('Error during code repair:', error);
        }
        
        // Apply additional safeguards before evaluation
        try {
          // If code still lacks a final closing brace after all fixes (edge case), add it
          const lastChar = sketch.trim().slice(-1);
          if (lastChar !== '}') {
            console.warn('Last character check: Adding missing closing brace');
            sketch = sketch.trim() + '\n}';
          }
          
          // Wrap in try-catch for safer evaluation
          const wrappedCode = `
            try {
              ${sketch}
            } catch(e) {
              console.error("Code evaluation error:", e);
              // Return a minimal valid sketch as fallback
              return function(p) {
                p.setup = function() { p.createCanvas(400, 400); };
                p.draw = function() { 
                  p.background(200, 0, 0);
                  p.fill(255);
                  p.textSize(18);
                  p.textAlign(p.CENTER);
                  p.text("Error in sketch code - see console", p.width/2, p.height/2);
                };
              };
            }
          `;
          
          // Evaluate the sketch string with error handling
          console.log('Evaluating final code structure');
          const fn = new Function(wrappedCode)();
          
          if (typeof fn !== 'function') {
            console.error('Sketch did not return a valid function');
            throw new Error('Sketch string must return a function');
          }
          
          sketchFn = fn;
        } catch (evalError) {
          console.error('Fatal error during sketch evaluation:', evalError);
          // Create a more informative error display function
          sketchFn = (p) => {
            p.setup = function() { 
              p.createCanvas(400, 400);
              p.textSize(16);
              p.textAlign(p.CENTER);
            };
            p.draw = function() {
              p.background(200, 0, 0);
              p.fill(255);
              p.text("Code evaluation error", p.width/2, p.height/2 - 40);
              p.text("Check the console for details", p.width/2, p.height/2);
              p.text("The sketch may be incomplete or invalid", p.width/2, p.height/2 + 40);
            };
          };
        }
      } else {
        sketchFn = sketch;
      }

      // Create p5 instance with adapting scaling
      p5Instance.current = new p5((p: any) => {
        try {
          // Store original createCanvas function
          const originalCreateCanvas = p.createCanvas;
          
          // Override createCanvas to handle responsive scaling
          p.createCanvas = function(w: number, h: number, renderer?: any) {
            // Call original with same arguments
            const canvas = originalCreateCanvas.apply(this, [w, h, renderer]);
            
            // Add resize handler to canvas for responsiveness
            const containerWidth = containerRef.current?.clientWidth || w;
            const containerHeight = containerRef.current?.clientHeight || h;
            
            // Calculate scale factor to fit canvas in container
            const scale = Math.min(
              containerWidth / w,
              containerHeight / h
            ) * 0.9; // 90% of max to ensure some margin
            
            // Apply scale transformation to canvas
            if (canvas && canvas.elt) {
              const canvasEl = canvas.elt;
              canvasEl.style.transformOrigin = 'center';
              canvasEl.style.transform = `scale(${scale})`;
              // Ensure canvas doesn't create scrollbars
              canvasEl.style.display = 'block';
              canvasEl.style.margin = 'auto';
            }
            
            return canvas;
          };
          
          // Execute the sketch code
          sketchFn(p);
          
          // Ensure setup and draw are defined
          if (!p.setup || !p.draw) {
            throw new Error('Sketch must define setup() and draw() functions');
          }
        } catch (e) {
          if (e instanceof Error) throw new Error(`Error in sketch execution: ${e.message}`);
          throw new Error('Unknown error in sketch execution');
        }
      }, containerRef.current);
    } catch (e) {
      console.error('Error initializing p5 sketch:', e);
      setError(e instanceof Error ? e.message : 'Unknown error');
    }

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
        p5Instance.current = null;
      }
    };
  }, [sketch, mounted]);

  if (!mounted) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-gray-100">
        <FontAwesomeIcon icon={faCircleNotch} spin className="mr-2" />
        Loading P5.js...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        <FontAwesomeIcon icon={faWarning} className="mr-2" />
        Failed to load P5.js sketch: {error}
      </div>
    );
  }

  return <div ref={containerRef} className="sketch-wrapper flex items-center justify-center w-full h-full bg-gray-800 overflow-hidden" />;
}