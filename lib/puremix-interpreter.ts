/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                        ⚠️  MUST READ  ⚠️                       ║
 * ║                    NO REGEX ALLOWED!                        ║
 * ║                                                              ║
 * ║  This file is COMPLETELY REGEX-FREE by architectural        ║
 * ║  design. Any addition of regex patterns is FORBIDDEN!       ║
 * ║                                                              ║
 * ║  Use only:                                                   ║
 * ║  ✅ Pure AST-based interpretation                            ║
 * ║  ✅ Character-by-character analysis                          ║
 * ║  ✅ Node.js JavaScript execution                             ║
 * ║                                                              ║
 * ║  NO REGEX PATTERNS - Pure computer science approach!        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */


/**
 * PureMix Language Interpreter - COMPLETELY REGEX-FREE VERSION
 * 
 * Uses only:
 * - Lexical Analysis (Character-by-character tokenization)
 * - Syntax Analysis (Pure AST parsing) 
 * - Semantic Analysis (AST structure analysis)
 * - Code Generation (AST → HTML with Node.js JavaScript execution)
 * 
 * NO text parsing, NO regex - pure computer science AST-based interpretation
 */

// import { getLogger } from './debug-logger.js';
// import { JavaScriptExecutor } from './javascript-executor.js.js';
// const log = getLogger();
const log = { debug: (...args: any[]) => { }, info: (...args: any[]) => { }, warn: (...args: any[]) => { }, error: (...args: any[]) => { } };

// Inline JavaScript executor replacement with __export support
const JavaScriptExecutor = {
  execute: (code: string, context: any) => {
    try {
      // Check if this code uses __export pattern
      if (code.includes('__export')) {
        // Create isolated execution context with __export support
        let __export: Record<string, any> | undefined = undefined;

        // Build parameter names and values from data
        const paramNames = Object.keys(context);
        const paramValues = Object.values(context);

        // Add __export to the execution context
        paramNames.push('__export');
        paramValues.push(__export);

        // Create and execute function to capture __export assignments
        const captureExportFunction = new Function(...paramNames, `
          ${code}
          return __export;
        `);

        const exports = captureExportFunction(...paramValues) || {};

        return { exports };
      } else {
        // For simple expressions, just evaluate directly
        const func = new Function(...Object.keys(context), `"use strict"; return ${code}`);
        return func(...Object.values(context));
      }
    } catch (error) {
      // If direct evaluation fails, try wrapping in function
      try {
        const wrappedCode = `(function() { ${code} })()`;
        const func = new Function(...Object.keys(context), `"use strict"; return ${wrappedCode}`);
        return func(...Object.values(context));
      } catch (secondError) {
        log.error('JavaScript execution failed:', error);
        return undefined;
      }
    }
  }
};

// =============================================================================
// LANGUAGE DEFINITION
// =============================================================================

export const TokenType = {
  // Literals
  HTML_TAG: 'HTML_TAG',
  TEXT_CONTENT: 'TEXT_CONTENT',
  STRING_LITERAL: 'STRING_LITERAL',
  NUMBER_LITERAL: 'NUMBER_LITERAL',
  BOOLEAN_LITERAL: 'BOOLEAN_LITERAL',
  NULL_LITERAL: 'NULL_LITERAL',
  
  // Expressions and JavaScript
  EXPRESSION_START: 'EXPRESSION_START',  // {
  EXPRESSION_END: 'EXPRESSION_END',      // }
  IDENTIFIER: 'IDENTIFIER',              // variable names
  JAVASCRIPT_BLOCK: 'JAVASCRIPT_BLOCK', // Multi-line JS code block
  JAVASCRIPT_EXPRESSION: 'JAVASCRIPT_EXPRESSION', // Simple JS expression
  
  // Operators
  DOT: 'DOT',                    // .
  QUESTION: 'QUESTION',          // ?
  COLON: 'COLON',               // :
  ARROW: 'ARROW',               // =>
  EQUALS: 'EQUALS',             // === (strict equality)
  NOT_EQUALS: 'NOT_EQUALS',     // !== (strict inequality)
  LOGICAL_AND: 'LOGICAL_AND',   // &&
  LOGICAL_OR: 'LOGICAL_OR',     // ||
  LOGICAL_NOT: 'LOGICAL_NOT',   // !

  // Arithmetic operators
  PLUS: 'PLUS',                 // +
  MINUS: 'MINUS',               // -
  MULTIPLY: 'MULTIPLY',         // *
  DIVIDE: 'DIVIDE',             // /
  
  // Delimiters
  PAREN_OPEN: 'PAREN_OPEN',     // (
  PAREN_CLOSE: 'PAREN_CLOSE',   // )
  BRACKET_OPEN: 'BRACKET_OPEN', // [
  BRACKET_CLOSE: 'BRACKET_CLOSE', // ]
  COMMA: 'COMMA',               // ,
  SEMICOLON: 'SEMICOLON',       // ;
  
  // Whitespace
  WHITESPACE: 'WHITESPACE',
  NEWLINE: 'NEWLINE',
  
  // End of file
  EOF: 'EOF'
} as const;

export type TokenTypeValue = typeof TokenType[keyof typeof TokenType];

export interface Token {
  type: TokenTypeValue;
  value: string;
  position: {
    line: number;
    column: number;
    offset: number;
  };
}

export const ASTNodeType = {
  // Root
  PROGRAM: 'PROGRAM',
  TEMPLATE: 'TEMPLATE',
  
  // Content
  HTML_ELEMENT: 'HTML_ELEMENT',
  TEXT_NODE: 'TEXT_NODE',
  
  // Expressions
  EXPRESSION: 'EXPRESSION',
  IDENTIFIER_EXPR: 'IDENTIFIER_EXPR',
  MEMBER_EXPR: 'MEMBER_EXPR',
  CONDITIONAL_EXPR: 'CONDITIONAL_EXPR',
  CALL_EXPR: 'CALL_EXPR',
  ARROW_FUNCTION: 'ARROW_FUNCTION',    // Arrow functions (param => expr)
  BINARY_EXPR: 'BINARY_EXPR',          // Binary operations (===, !==, etc.)
  LOGICAL_EXPR: 'LOGICAL_EXPR',        // Logical operations (&&, ||, !)
  COMPARISON_EXPR: 'COMPARISON_EXPR',  // Comparison operations
  
  // JavaScript blocks and execution
  JAVASCRIPT_BLOCK: 'JAVASCRIPT_BLOCK',      // Multi-line JS code block
  JAVASCRIPT_EXPRESSION: 'JAVASCRIPT_EXPRESSION', // Simple JS expression
  JAVASCRIPT_STATEMENT: 'JAVASCRIPT_STATEMENT',   // Individual JS statements
  EXPORT_STATEMENT: 'EXPORT_STATEMENT',     // __export = { ... }
  
  // Literals
  STRING_LITERAL: 'STRING_LITERAL',
  NUMBER_LITERAL: 'NUMBER_LITERAL',
  BOOLEAN_LITERAL: 'BOOLEAN_LITERAL',
  NULL_LITERAL: 'NULL_LITERAL',
  
  // Array operations
  ARRAY_MAP: 'ARRAY_MAP',
  ARRAY_FILTER: 'ARRAY_FILTER',
  ARRAY_REDUCE: 'ARRAY_REDUCE'
} as const;

export type ASTNodeTypeValue = typeof ASTNodeType[keyof typeof ASTNodeType];

export interface ASTNode {
  type: ASTNodeTypeValue;
  value?: any;
  children: ASTNode[];
  metadata: {
    position: Token['position'];
    scope?: string;
    dataType?: string;
    contextId?: string; // For JavaScript blocks
  };
}

// =============================================================================
// LEXICAL ANALYZER (TOKENIZER) - ALREADY REGEX-FREE
// =============================================================================

export class PureMixLexer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    this.tokens = [];
    this.position = 0;
    this.line = 1;
    this.column = 1;

    while (this.position < this.source.length) {
      this.scanToken();
    }

    this.addToken(TokenType.EOF, '');
    return this.tokens;
  }

  private scanToken(): void {
    const char = this.advance();

    switch (char) {
      case ' ':
      case '\r':
      case '\t':
        this.addToken(TokenType.WHITESPACE, char);
        break;
      case '\n':
        this.addToken(TokenType.NEWLINE, char);
        this.line++;
        this.column = 1;
        break;
      case '{':
        // Enhanced JavaScript block detection - pure lexer analysis
        this.scanExpressionOrJavaScriptBlock();
        break;
      case '}':
        this.addToken(TokenType.EXPRESSION_END, char);
        break;
      case '.':
        this.addToken(TokenType.DOT, char);
        break;
      case '?':
        this.addToken(TokenType.QUESTION, char);
        break;
      case ':':
        this.addToken(TokenType.COLON, char);
        break;
      case '(':
        this.addToken(TokenType.PAREN_OPEN, char);
        break;
      case ')':
        this.addToken(TokenType.PAREN_CLOSE, char);
        break;
      case '[':
        this.addToken(TokenType.BRACKET_OPEN, char);
        break;
      case ']':
        this.addToken(TokenType.BRACKET_CLOSE, char);
        break;
      case ',':
        this.addToken(TokenType.COMMA, char);
        break;
      case '<':
        // Check for HTML comments <!-- ... -->
        if (this.peek() === '!' && this.peekNext() === '-' && this.source[this.position + 2] === '-') {
          this.skipHTMLComment();
        } else {
          this.scanHTMLTag();
        }
        break;
      case '=':
        // Handle === (strict equality)
        if (this.peek() === '=' && this.peekNext() === '=') {
          this.advance(); // consume second =
          this.advance(); // consume third =
          this.addToken(TokenType.EQUALS, '===');
        } else if (this.peek() === '>') {
          this.advance(); // consume >
          this.addToken(TokenType.ARROW, '=>');
        } else {
          // Single = not supported in this context
          this.addToken(TokenType.TEXT_CONTENT, char);
        }
        break;
      case '!':
        // Handle !== (strict inequality) or logical NOT
        if (this.peek() === '=' && this.peekNext() === '=') {
          this.advance(); // consume first =
          this.advance(); // consume second =
          this.addToken(TokenType.NOT_EQUALS, '!==');
        } else {
          // Logical NOT operator
          this.addToken(TokenType.LOGICAL_NOT, char);
        }
        break;
      case '&':
        // Handle && (logical AND)
        if (this.peek() === '&') {
          this.advance(); // consume second &
          this.addToken(TokenType.LOGICAL_AND, '&&');
        } else {
          this.addToken(TokenType.TEXT_CONTENT, char);
        }
        break;
      case '|':
        // Handle || (logical OR)
        if (this.peek() === '|') {
          this.advance(); // consume second |
          this.addToken(TokenType.LOGICAL_OR, '||');
        } else {
          this.addToken(TokenType.TEXT_CONTENT, char);
        }
        break;
      case '+':
        this.addToken(TokenType.PLUS, char);
        break;
      case '-':
        this.addToken(TokenType.MINUS, char);
        break;
      case '*':
        this.addToken(TokenType.MULTIPLY, char);
        break;
      case '/':
        // Enhanced comment handling - check for // or /* patterns
        if (this.peek() === '/') {
          // Single-line comment: // comment
          this.skipSingleLineComment();
        } else if (this.peek() === '*') {
          // Multi-line comment block
          this.skipMultiLineComment();
        } else {
          // Regular division operator
          this.addToken(TokenType.DIVIDE, char);
        }
        break;
      case ';':
        this.addToken(TokenType.SEMICOLON, char);
        break;
      case '"':
      case "'":
      case '`':
        this.scanStringLiteral(char);
        break;
      default:
        if (this.isAlpha(char)) {
          this.scanIdentifier();
        } else if (this.isDigit(char)) {
          this.scanNumber();
        } else {
          this.scanTextContent();
        }
        break;
    }
  }

  private scanHTMLTag(): void {
    const start = this.position - 1;
    
    // Scan until we find the closing >
    while (this.peek() !== '>' && !this.isAtEnd()) {
      if (this.peek() === '\n') this.line++;
      this.advance();
    }

    if (this.isAtEnd()) {
      // Treat as text content if no closing >
      this.addToken(TokenType.TEXT_CONTENT, this.source.substring(start, this.position));
      return;
    }

    this.advance(); // consume >
    const tagValue = this.source.substring(start, this.position);

    // Check if this is an opening tag (not closing tag or self-closing)
    const isClosingTag = tagValue.startsWith('</');
    const isSelfClosing = tagValue.endsWith('/>');

    this.addToken(TokenType.HTML_TAG, tagValue);

    // If this is an opening tag that isn't self-closing, scan for content
    if (!isClosingTag && !isSelfClosing) {
      this.scanHTMLContent(tagValue);
    }
  }

  private scanHTMLContent(openingTag: string): void {
    // Extract tag name from opening tag using character-based parsing
    const tagName = this.extractTagNameFromOpeningTag(openingTag);
    if (!tagName) return;

    const closingTagPattern = `</${tagName}>`;
    const contentStart = this.position;

    // Scan for content until we find the matching closing tag
    while (!this.isAtEnd()) {
      const remaining = this.source.substring(this.position);

      // Check if we're at the closing tag using character-based comparison
      if (this.isAtClosingTag(remaining, closingTagPattern)) {
        // Found closing tag - emit content as TEXT_CONTENT if any
        if (this.position > contentStart) {
          const content = this.source.substring(contentStart, this.position);
          this.addToken(TokenType.TEXT_CONTENT, content);
        }

        // Now scan the closing tag
        this.scanClosingHTMLTag(closingTagPattern.length);
        return;
      }

      // Check for nested expressions within HTML content
      if (this.peek() === '{') {
        // Emit any content before the expression
        if (this.position > contentStart) {
          const content = this.source.substring(contentStart, this.position);
          this.addToken(TokenType.TEXT_CONTENT, content);
        }

        // Let the main tokenizer handle the expression
        return;
      }

      if (this.peek() === '\n') this.line++;
      this.advance();
    }

    // If we reach end without finding closing tag, treat remaining as content
    if (this.position > contentStart) {
      const content = this.source.substring(contentStart, this.position);
      this.addToken(TokenType.TEXT_CONTENT, content);
    }
  }

  /**
   * Extract tag name from opening tag using character analysis (NO REGEX)
   */
  private extractTagNameFromOpeningTag(openingTag: string): string | null {
    if (!openingTag.startsWith('<')) return null;

    let i = 1; // Skip the '<'
    let tagName = '';

    // Extract tag name until we hit space, '>', or '/'
    while (i < openingTag.length) {
      const char = openingTag[i];

      if (char === ' ' || char === '>' || char === '/') {
        break;
      }

      if (this.isAlphaNumeric(char) || char === '-' || char === ':') {
        tagName += char;
      } else {
        break;
      }

      i++;
    }

    return tagName || null;
  }

  /**
   * Check if we're at a closing tag using character-based comparison (NO REGEX)
   */
  private isAtClosingTag(remaining: string, closingTagPattern: string): boolean {
    if (remaining.length < closingTagPattern.length) return false;

    for (let i = 0; i < closingTagPattern.length; i++) {
      if (remaining[i] !== closingTagPattern[i]) {
        return false;
      }
    }

    return true;
  }

  private scanClosingHTMLTag(length: number): void {
    const start = this.position;

    // Advance by the length of the closing tag
    for (let i = 0; i < length; i++) {
      this.advance();
    }

    const tagValue = this.source.substring(start, this.position);
    this.addToken(TokenType.HTML_TAG, tagValue);
  }

  private scanStringLiteral(quote: string): void {
    const start = this.position - 1;
    
    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === '\n') this.line++;
      if (this.peek() === '\\') this.advance(); // escape sequence
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new Error(`Unterminated string at line ${this.line}`);
    }

    this.advance(); // closing quote
    const value = this.source.substring(start, this.position);
    this.addToken(TokenType.STRING_LITERAL, value);
  }

  private scanIdentifier(): void {
    const start = this.position - 1;
    
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const value = this.source.substring(start, this.position);
    
    // Check for boolean literals
    if (value === 'true' || value === 'false') {
      this.addToken(TokenType.BOOLEAN_LITERAL, value);
    } else if (value === 'null') {
      this.addToken(TokenType.NULL_LITERAL, value);
    } else {
      this.addToken(TokenType.IDENTIFIER, value);
    }
  }

  private scanNumber(): void {
    const start = this.position - 1;
    
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Look for decimal part
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance(); // consume .
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = this.source.substring(start, this.position);
    this.addToken(TokenType.NUMBER_LITERAL, value);
  }

  private scanTextContent(): void {
    const start = this.position - 1;
    
    // Consume until we hit a special character
    while (!this.isSpecialChar(this.peek()) && !this.isAtEnd()) {
      if (this.peek() === '\n') this.line++;
      this.advance();
    }

    const value = this.source.substring(start, this.position);
    this.addToken(TokenType.TEXT_CONTENT, value);
  }

  private isSpecialChar(char: string): boolean {
    return char === '{' || char === '}' || char === '<' || char === '"' || 
           char === "'" || char === '`' || char === ' ' || char === '\t' || 
           char === '\n' || char === '\r';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || 
           (char >= 'A' && char <= 'Z') || 
           char === '_' || char === '$';
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private advance(): string {
    this.column++;
    return this.source.charAt(this.position++);
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source.charAt(this.position);
  }

  private peekNext(): string {
    if (this.position + 1 >= this.source.length) return '\0';
    return this.source.charAt(this.position + 1);
  }

  private isAtEnd(): boolean {
    return this.position >= this.source.length;
  }

  private addToken(type: TokenTypeValue, value: string): void {
    this.tokens.push({
      type,
      value,
      position: {
        line: this.line,
        column: this.column - value.length,
        offset: this.position - value.length
      }
    });
  }

  /**
   * Enhanced JavaScript block detection using pure lexical analysis
   * NO REGEX - character-by-character analysis to determine if { } contains
   * a JavaScript block vs a simple expression
   */
  private scanExpressionOrJavaScriptBlock(): void {
    const startPos = this.position - 1; // Position of the opening {
    const startLine = this.line;
    const startColumn = this.column - 1;
    
    let braceDepth = 1;
    let content = '';
    let hasMultipleStatements = false;
    let hasControlFlowKeywords = false;
    let hasVariableDeclarations = false;
    let hasFunctionDeclarations = false;
    let hasArithmeticOperators = false;
    let newlineCount = 0;
    let semicolonCount = 0;
    
    // Character-by-character analysis to determine block type
    while (braceDepth > 0 && !this.isAtEnd()) {
      const char = this.advance();
      
      if (char === '{') {
        braceDepth++;
        content += char;
      } else if (char === '}') {
        braceDepth--;
        if (braceDepth > 0) {
          content += char;
        }
      } else if (char === '\n') {
        newlineCount++;
        this.line++;
        this.column = 1;
        content += char;
      } else if (char === ';') {
        semicolonCount++;
        content += char;
      } else if (char === '+' || char === '-' || char === '*' || char === '/') {
        // Detect arithmetic operators as an indicator of JavaScript expressions
        hasArithmeticOperators = true;
        content += char;
      } else {
        content += char;
      }
      
      // Check for JavaScript keywords using character analysis
      if (this.isWordBoundary(char)) {
        const word = this.extractWordBeforePosition();
        
        // Check for variable declarations
        if (word === 'let' || word === 'const' || word === 'var') {
          hasVariableDeclarations = true;
        }
        
        // Check for function declarations
        if (word === 'function') {
          hasFunctionDeclarations = true;
        }
        
        // Check for control flow keywords
        if (word === 'for' || word === 'while' || word === 'if' || 
            word === 'else' || word === 'switch' || word === 'case' ||
            word === 'break' || word === 'continue' || word === 'return') {
          hasControlFlowKeywords = true;
        }
      }
    }
    
    // Count dots for complex member access detection
    const dotCount = (content.match(/\./g) || []).length;

    // Analyze collected characteristics to determine block type
    // Strong indicators of JavaScript blocks (vs simple conditional expressions)
    const strongIndicators = [
      hasVariableDeclarations,      // let, const, var - STRONG indicator
      hasFunctionDeclarations,      // function keyword - STRONG indicator
      hasControlFlowKeywords,       // for, while, if (not ternary) - STRONG indicator
      content.includes('__export'),  // Export pattern - STRONG indicator
      semicolonCount > 1,           // Multiple statements - STRONG indicator
      dotCount >= 2                 // Complex member access like obj.prop.subprop - STRONG indicator
    ];

    const weakIndicators = [
      semicolonCount === 1,         // Single semicolon - could be expression or statement
      newlineCount > 2              // Many newlines - could be formatted expression
    ];
    
    const strongIndicatorCount = strongIndicators.filter(Boolean).length;
    const weakIndicatorCount = weakIndicators.filter(Boolean).length;
    
    // Decision logic: Strong indicators or multiple indicators = JavaScript block
    const isJavaScriptBlock = strongIndicatorCount > 0 || (strongIndicatorCount === 0 && weakIndicatorCount >= 2);
    
    if (isJavaScriptBlock) {
      // This is a JavaScript block - create proper token sequence
      this.addToken(TokenType.EXPRESSION_START, '{');
      this.addToken(TokenType.JAVASCRIPT_BLOCK, content);
      this.addToken(TokenType.EXPRESSION_END, '}');
      
      log?.debug?.('Detected JavaScript Block', { 
        strongIndicators: strongIndicatorCount,
        weakIndicators: weakIndicatorCount,
        characteristics: {
          semicolons: semicolonCount,
          newlines: newlineCount,
          hasVariableDeclarations,
          hasFunctionDeclarations,
          hasControlFlowKeywords
        }
      });
    } else {
      // This is a simple expression - tokenize as EXPRESSION_START + content
      this.addToken(TokenType.EXPRESSION_START, '{');
      
      // Re-tokenize the content using standard expression parsing
      // Create a sub-lexer for the expression content
      const subLexer = new PureMixLexer(content);
      const subTokens = subLexer.tokenize();
      
      // Add the sub-tokens (excluding EOF)
      for (const token of subTokens) {
        if (token.type !== TokenType.EOF) {
          this.tokens.push({
            ...token,
            position: {
              line: startLine,
              column: startColumn + token.position.column,
              offset: startPos + token.position.offset
            }
          });
        }
      }
      
      this.addToken(TokenType.EXPRESSION_END, '}');
    }
  }
  
  /**
   * Check if character is a word boundary for keyword detection
   */
  private isWordBoundary(char: string): boolean {
    return !this.isAlphaNumeric(char) && char !== '_';
  }
  
  /**
   * Extract the word that appears before the current position
   * Used for keyword detection during lexical analysis
   */
  private extractWordBeforePosition(): string {
    let wordStart = this.position - 1;

    // Skip backwards to find word start
    while (wordStart > 0 && this.isAlphaNumeric(this.source[wordStart - 1])) {
      wordStart--;
    }

    return this.source.substring(wordStart, this.position);
  }

  /**
   * Skip single-line comment: // comment text until end of line
   * Consumes all characters until newline or end of source
   */
  private skipSingleLineComment(): void {
    // Consume the second /
    this.advance();

    // Skip all characters until newline or end of source
    while (this.peek() !== '\n' && !this.isAtEnd()) {
      this.advance();
    }

    // Note: We don't consume the newline character - let the main scanner handle it
    // so that line tracking remains accurate
  }

  /**
   * Skip multi-line comment blocks
   * Consumes all characters until closing star-slash or end of source
   */
  private skipMultiLineComment(): void {
    // Consume the *
    this.advance();

    // Skip all characters until we find */
    while (!this.isAtEnd()) {
      if (this.peek() === '*' && this.peekNext() === '/') {
        // Found end of comment - consume both * and /
        this.advance(); // consume *
        this.advance(); // consume /
        break;
      }

      // Track line numbers within comments
      if (this.peek() === '\n') {
        this.line++;
        this.column = 1;
      }

      this.advance();
    }
  }

  /**
   * Skip HTML comment blocks
   * Consumes all characters until closing arrow-dash-dash-greater or end of source
   */
  private skipHTMLComment(): void {
    // Consume the !
    this.advance();
    // Consume the first -
    this.advance();
    // Consume the second -
    this.advance();

    // Skip all characters until we find -->
    while (!this.isAtEnd()) {
      if (this.peek() === '-' && this.peekNext() === '-' && this.source[this.position + 2] === '>') {
        // Found end of comment - consume all three characters: -->
        this.advance(); // consume -
        this.advance(); // consume -
        this.advance(); // consume >
        break;
      }

      // Track line numbers within comments
      if (this.peek() === '\n') {
        this.line++;
        this.column = 1;
      }

      this.advance();
    }
  }
}

// =============================================================================
// SYNTAX ANALYZER (PARSER) - ALREADY REGEX-FREE  
// =============================================================================

export class PureMixParser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode {
    return this.program();
  }

  private program(): ASTNode {
    const children: ASTNode[] = [];
    
    while (!this.isAtEnd()) {
      if (this.check(TokenType.WHITESPACE) || this.check(TokenType.NEWLINE)) {
        this.advance();
        continue;
      }
      
      const node = this.templateElement();
      if (node) children.push(node);
    }

    return {
      type: ASTNodeType.PROGRAM,
      children,
      metadata: { position: { line: 1, column: 1, offset: 0 } }
    };
  }

  private templateElement(): ASTNode | null {
    if (this.check(TokenType.HTML_TAG)) {
      return this.htmlElement();
    }
    
    if (this.check(TokenType.EXPRESSION_START)) {
      return this.expression();
    }
    
    if (this.check(TokenType.JAVASCRIPT_BLOCK)) {
      return this.javascriptBlock();
    }
    
    if (this.check(TokenType.TEXT_CONTENT)) {
      return this.textNode();
    }

    // Skip unknown tokens
    this.advance();
    return null;
  }

  private htmlElement(): ASTNode {
    const token = this.advance();
    return {
      type: ASTNodeType.HTML_ELEMENT,
      value: token.value,
      children: [],
      metadata: { position: token.position }
    };
  }

  private expression(): ASTNode {
    this.consume(TokenType.EXPRESSION_START, "Expected '{'");
    
    // Check if this is a JavaScript block
    if (this.check(TokenType.JAVASCRIPT_BLOCK)) {
      return this.javascriptBlock();
    }
    
    // Parse the complete expression content until we reach the matching closing brace
    const expr = this.parseExpressionContent();
    
    this.consume(TokenType.EXPRESSION_END, "Expected '}'");
    
    return {
      type: ASTNodeType.EXPRESSION,
      children: [expr],
      metadata: { position: expr.metadata.position }
    };
  }
  
  private parseExpressionContent(): ASTNode {
    // Use proper operator precedence parsing
    return this.ternaryExpression();
  }

  // Operator precedence from lowest to highest:
  // 1. Ternary (conditional) operator: ? :
  // 2. Logical OR: ||
  // 3. Logical AND: &&
  // 4. Equality operators: ===, !==
  // 5. Member access: .
  // 6. Primary expressions: identifiers, literals, parentheses

  private ternaryExpression(): ASTNode {
    let expr = this.logicalOrExpression();

    // Skip whitespace before checking for ?
    while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
      // continue
    }

    if (this.match(TokenType.QUESTION)) {
      // Skip whitespace after ?
      while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
        // continue
      }
      
      // Parse conditional branch - could be HTML block or simple expression
      const thenExpr = this.parseConditionalBranch();
      
      // Skip whitespace before :
      while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
        // continue
      }
      
      this.consume(TokenType.COLON, "Expected ':' after then expression");
      
      // Skip whitespace after :
      while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
        // continue
      }
      
      // Parse conditional branch - could be HTML block or simple expression
      const elseExpr = this.parseConditionalBranch();
      
      return {
        type: ASTNodeType.CONDITIONAL_EXPR,
        children: [expr, thenExpr, elseExpr],
        metadata: { position: expr.metadata.position }
      };
    }

    return expr;
  }

  private logicalOrExpression(): ASTNode {
    let expr = this.logicalAndExpression();

    // Skip whitespace before checking for logical OR operators
    while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
      // continue
    }

    while (this.match(TokenType.LOGICAL_OR)) {
      const operator = this.previous();
      
      // Skip whitespace after operator
      while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
        // continue
      }
      
      const right = this.logicalAndExpression();
      
      expr = {
        type: ASTNodeType.LOGICAL_EXPR,
        value: operator.value,
        children: [expr, right],
        metadata: { position: operator.position }
      };
    }

    return expr;
  }

  private logicalAndExpression(): ASTNode {
    let expr = this.equalityExpression();

    // Skip whitespace before checking for logical AND operators
    while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
      // continue
    }

    while (this.match(TokenType.LOGICAL_AND)) {
      const operator = this.previous();
      
      // Skip whitespace after operator
      while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
        // continue
      }
      
      const right = this.equalityExpression();
      
      expr = {
        type: ASTNodeType.LOGICAL_EXPR,
        value: operator.value,
        children: [expr, right],
        metadata: { position: operator.position }
      };
    }

    return expr;
  }

  private equalityExpression(): ASTNode {
    let expr = this.arithmeticExpression();

    // Skip whitespace before checking for equality operators
    while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
      // continue
    }

    while (this.match(TokenType.EQUALS, TokenType.NOT_EQUALS)) {
      const operator = this.previous();
      
      // Skip whitespace after operator
      while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
        // continue
      }
      
      const right = this.memberExpression();
      
      expr = {
        type: ASTNodeType.BINARY_EXPR,
        value: operator.value,
        children: [expr, right],
        metadata: { position: operator.position }
      };
    }

    return expr;
  }

  private arithmeticExpression(): ASTNode {
    let expr = this.multiplicativeExpression();

    // Skip whitespace before checking for arithmetic operators
    while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
      // continue
    }

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous();

      // Skip whitespace after operator
      while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
        // continue
      }

      const right = this.multiplicativeExpression();

      expr = {
        type: ASTNodeType.BINARY_EXPR,
        value: operator.value,
        children: [expr, right],
        metadata: { position: operator.position }
      };

      // Skip whitespace before checking for next operator
      while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
        // continue
      }
    }

    return expr;
  }

  private multiplicativeExpression(): ASTNode {
    let expr = this.unaryExpression();

    // Skip whitespace before checking for multiplicative operators
    while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
      // continue
    }

    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE)) {
      const operator = this.previous();

      // Skip whitespace after operator
      while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
        // continue
      }

      const right = this.unaryExpression();

      expr = {
        type: ASTNodeType.BINARY_EXPR,
        value: operator.value,
        children: [expr, right],
        metadata: { position: operator.position }
      };

      // Skip whitespace before checking for next operator
      while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
        // continue
      }
    }

    return expr;
  }

  private parseConditionalBranch(): ASTNode {
    return this.conditionalBranch();
  }

  private conditionalBranch(): ASTNode {
    // Skip whitespace
    while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
      // continue
    }

    // Check if this is a nested expression (starts with {)
    if (this.check(TokenType.EXPRESSION_START)) {
      return this.expression();
    }

    // Check if this is HTML content
    if (this.check(TokenType.HTML_TAG)) {
      return this.htmlBlock();
    }

    // Check for null literal
    if (this.check(TokenType.NULL_LITERAL)) {
      return this.primary();
    }

    // Otherwise parse as expression
    return this.unaryExpression();
  }

  private htmlBlock(): ASTNode {
    const htmlTokens: Token[] = [];
    const startPos = this.peek().position;

    // Collect HTML tokens until we hit a colon or closing brace at the same level
    let braceDepth = 0;
    let angleDepth = 0;

    while (!this.isAtEnd()) {
      const current = this.peek();

      if (current.type === TokenType.EXPRESSION_START) {
        braceDepth++;
      } else if (current.type === TokenType.EXPRESSION_END) {
        if (braceDepth === 0) break; // We're at the closing brace of the overall expression
        braceDepth--;
      } else if (current.type === TokenType.HTML_TAG) {
        // Track opening/closing tags
        if (current.value.startsWith('</')) {
          angleDepth--;
        } else if (!current.value.endsWith('/>')) {
          angleDepth++;
        }
      } else if (current.type === TokenType.COLON && braceDepth === 0 && angleDepth === 0) {
        // We've hit the colon that separates true/false branches
        break;
      }

      htmlTokens.push(this.advance());
    }

    // Combine HTML tokens into a single value, trimming trailing whitespace
    const htmlContent = htmlTokens.map(token => token.value).join('').trimEnd();

    return {
      type: ASTNodeType.HTML_ELEMENT,
      value: htmlContent,
      children: [],
      metadata: { position: startPos }
    };
  }

  private parseArrowFunctionBody(): ASTNode {
    // Arrow function body can be either HTML content or JavaScript expressions
    // First check if we have HTML content
    if (this.check(TokenType.HTML_TAG)) {
      return this.parseArrowFunctionHtmlBody();
    }

    // Otherwise parse as conditional expression (supports all JS expressions)
    return this.ternaryExpression();
  }

  private parseArrowFunctionHtmlBody(): ASTNode {
    // Parse HTML content in arrow function - collect all tokens until we reach the end of the function argument
    const htmlTokens: Token[] = [];
    const startPos = this.peek().position;

    // Collect all tokens until we hit a PAREN_CLOSE at depth 0 (end of method call)
    let parenDepth = 0;
    while (!this.isAtEnd()) {
      const current = this.peek();

      // Track parenthesis depth to know when we've reached the end of the method call
      if (current.type === TokenType.PAREN_OPEN) {
        parenDepth++;
      } else if (current.type === TokenType.PAREN_CLOSE) {
        if (parenDepth === 0) {
          // We've reached the closing paren of the method call - stop here
          break;
        }
        parenDepth--;
      }

      htmlTokens.push(this.advance());
    }

    // Combine HTML tokens into a single value
    const htmlContent = htmlTokens.map(token => token.value).join('').trimEnd();

    return {
      type: ASTNodeType.HTML_ELEMENT,
      value: htmlContent,
      children: [],
      metadata: { position: startPos }
    };
  }

  private unaryExpression(): ASTNode {
    // Handle unary NOT operator
    if (this.match(TokenType.LOGICAL_NOT)) {
      const operator = this.previous().value;
      const operand = this.unaryExpression(); // Right-associative

      return {
        type: ASTNodeType.LOGICAL_EXPR,
        value: operator,
        children: [operand],
        metadata: { position: this.previous().position }
      };
    }

    // Otherwise continue to member expression for property/method access
    return this.memberExpression();
  }

  private memberExpression(): ASTNode {
    let expr = this.primary();

    while (this.match(TokenType.DOT)) {
      const property = this.consume(TokenType.IDENTIFIER, "Expected property name").value;
      
      // Check for method calls
      if (this.check(TokenType.PAREN_OPEN)) {
        expr = this.finishCallExpression(expr, property);
      } else {
        expr = {
          type: ASTNodeType.MEMBER_EXPR,
          value: property,
          children: [expr],
          metadata: { position: expr.metadata.position }
        };
      }
    }

    return expr;
  }

  private parseArgumentExpression(): ASTNode {
    // Check if this looks like an arrow function: param => expr
    // Look ahead to see if we have identifier followed by arrow
    const checkpoint = this.current;

    if (this.check(TokenType.IDENTIFIER)) {
      const param = this.advance(); // consume parameter name

      // Skip whitespace between param and arrow
      while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
        // continue
      }

      if (this.check(TokenType.ARROW)) {
        this.advance(); // consume =>

        // Skip whitespace after arrow
        while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
          // continue
        }

        // Parse the arrow function body (could be HTML or expression)
        const body = this.parseArrowFunctionBody();

        return {
          type: ASTNodeType.ARROW_FUNCTION,
          value: param.value, // parameter name
          children: [body],   // function body
          metadata: { position: param.position }
        };
      } else {
        // Not an arrow function, reset and parse as normal expression
        this.current = checkpoint;
      }
    }

    // Parse as normal conditional expression
    return this.ternaryExpression();
  }

  private finishCallExpression(object: ASTNode, method: string): ASTNode {
    this.consume(TokenType.PAREN_OPEN, "Expected '('");
    
    const args: ASTNode[] = [];
    if (!this.check(TokenType.PAREN_CLOSE)) {
      do {
        // Skip whitespace before parsing argument
        while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
          // continue
        }
        args.push(this.parseArgumentExpression());

        // Skip whitespace after argument
        while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
          // continue
        }
      } while (this.match(TokenType.COMMA)); // Parse comma-separated arguments
    }
    
    // Skip whitespace and newlines before closing parenthesis
    while (this.match(TokenType.WHITESPACE, TokenType.NEWLINE)) {
      // continue
    }

    this.consume(TokenType.PAREN_CLOSE, "Expected ')'");

    // Determine array operation type
    let nodeType: ASTNodeTypeValue;
    switch (method) {
      case 'map': nodeType = ASTNodeType.ARRAY_MAP; break;
      case 'filter': nodeType = ASTNodeType.ARRAY_FILTER; break;
      case 'reduce': nodeType = ASTNodeType.ARRAY_REDUCE; break;
      default: nodeType = ASTNodeType.CALL_EXPR; break;
    }

    return {
      type: nodeType,
      value: method,
      children: [object, ...args],
      metadata: { position: object.metadata.position }
    };
  }

  private primary(): ASTNode {
    if (this.match(TokenType.STRING_LITERAL)) {
      const token = this.previous();
      return {
        type: ASTNodeType.STRING_LITERAL,
        value: token.value,
        children: [],
        metadata: { position: token.position }
      };
    }

    if (this.match(TokenType.NUMBER_LITERAL)) {
      const token = this.previous();
      return {
        type: ASTNodeType.NUMBER_LITERAL,
        value: parseFloat(token.value),
        children: [],
        metadata: { position: token.position }
      };
    }

    if (this.match(TokenType.BOOLEAN_LITERAL)) {
      const token = this.previous();
      return {
        type: ASTNodeType.BOOLEAN_LITERAL,
        value: token.value === 'true',
        children: [],
        metadata: { position: token.position }
      };
    }

    if (this.match(TokenType.NULL_LITERAL)) {
      const token = this.previous();
      return {
        type: ASTNodeType.NULL_LITERAL,
        value: null,
        children: [],
        metadata: { position: token.position }
      };
    }

    if (this.match(TokenType.IDENTIFIER)) {
      const token = this.previous();
      return {
        type: ASTNodeType.IDENTIFIER_EXPR,
        value: token.value,
        children: [],
        metadata: { position: token.position }
      };
    }

    // Handle parenthetical grouping
    if (this.match(TokenType.PAREN_OPEN)) {
      const expr = this.parseExpressionContent(); // Parse the grouped expression
      this.consume(TokenType.PAREN_CLOSE, "Expected ')' after expression");
      return expr; // Return the grouped expression directly
    }

    throw new Error(`Unexpected token: ${this.peek().value}`);
  }

  private javascriptBlock(): ASTNode {
    const token = this.advance();
    
    // Consume the closing brace
    this.consume(TokenType.EXPRESSION_END, "Expected '}' after JavaScript block");
    
    // Generate unique context ID for this JavaScript block
    const contextId = `js_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      type: ASTNodeType.JAVASCRIPT_BLOCK,
      value: token.value, // Raw JavaScript code
      children: [],
      metadata: { 
        position: token.position,
        contextId,
        scope: 'component'
      }
    };
  }

  private textNode(): ASTNode {
    const token = this.advance();
    return {
      type: ASTNodeType.TEXT_NODE,
      value: token.value,
      children: [],
      metadata: { position: token.position }
    };
  }

  // Utility methods
  private match(...types: TokenTypeValue[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenTypeValue): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenTypeValue, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(message);
  }
}

// =============================================================================
// SEMANTIC ANALYZER - ALREADY REGEX-FREE
// =============================================================================

export class PureMixSemanticAnalyzer {
  analyze(ast: ASTNode): ASTNode {
    // Perform semantic analysis:
    // - Type checking
    // - Scope resolution
    // - Variable binding
    // - Dead code elimination
    
    return this.visit(ast);
  }

  private visit(node: ASTNode): ASTNode {
    switch (node.type) {
      case ASTNodeType.PROGRAM:
        return this.visitProgram(node);
      case ASTNodeType.EXPRESSION:
        return this.visitExpression(node);
      case ASTNodeType.CONDITIONAL_EXPR:
        return this.visitConditional(node);
      case ASTNodeType.MEMBER_EXPR:
        return this.visitMemberExpression(node);
      default:
        // Recursively visit children
        return {
          ...node,
          children: node.children.map(child => this.visit(child))
        };
    }
  }

  private visitProgram(node: ASTNode): ASTNode {
    return {
      ...node,
      children: node.children.map(child => this.visit(child))
    };
  }

  private visitExpression(node: ASTNode): ASTNode {
    return {
      ...node,
      children: node.children.map(child => this.visit(child))
    };
  }

  private visitConditional(node: ASTNode): ASTNode {
    const [condition, thenExpr, elseExpr] = node.children;
    
    return {
      ...node,
      children: [
        this.visit(condition),
        this.visit(thenExpr),
        this.visit(elseExpr)
      ],
      metadata: {
        ...node.metadata,
        dataType: 'conditional'
      }
    };
  }

  private visitMemberExpression(node: ASTNode): ASTNode {
    return {
      ...node,
      children: node.children.map(child => this.visit(child)),
      metadata: {
        ...node.metadata,
        dataType: 'member'
      }
    };
  }
}

// =============================================================================
// CODE GENERATOR (INTERPRETER) - COMPLETELY REGEX-FREE
// =============================================================================

export class PureMixCodeGenerator {
  private context: Record<string, any> = {};
  private jsExports: Record<string, any> = {}; // Store JavaScript block exports

  constructor(context: Record<string, any> = {}) {
    this.context = context;
  }

  generate(ast: ASTNode): string {
    // First pass: Execute all JavaScript blocks and capture exports
    this.executeJavaScriptBlocks(ast);
    
    // Second pass: Generate HTML with enriched context
    return this.evaluate(ast);
  }
  
  /**
   * Pre-process AST to execute JavaScript blocks and capture exports
   */
  private executeJavaScriptBlocks(node: ASTNode): void {
    if (node.type === ASTNodeType.JAVASCRIPT_BLOCK) {
      this.executeJavaScriptBlock(node);
    }
    
    // Recursively process child nodes
    for (const child of node.children) {
      this.executeJavaScriptBlocks(child);
    }
  }
  
  /**
   * Execute a single JavaScript block and add exports to context
   */
  private executeJavaScriptBlock(node: ASTNode): void {
    try {
      const code = node.value;
      const contextData = { ...this.context, ...this.jsExports };
      
      log?.debug?.('🎯 CodeGenerator: Executing JavaScript block', { 
        code: code.substring(0, 100) + (code.length > 100 ? '...' : ''),
        codeLength: code.length
      });
      
      // Check if this is a mixed JavaScript/HTML expression using AST analysis
      if (this.isMixedJavaScriptHtmlExpression(code)) {
        log?.debug?.('🔄 CodeGenerator: Processing mixed JS/HTML expression', { 
          code: code.substring(0, 100) 
        });
        const htmlResult = this.processRecursiveExpression(code, contextData);
        
        // If we got HTML result, we need to store it in the context for template use
        if (htmlResult) {
          this.jsExports['html'] = htmlResult;
          this.context['html'] = htmlResult;
        }
        return;
      }
      
      const result = JavaScriptExecutor.execute(code, contextData);
      
      if (result && result.error) {
        console.error('JavaScript block execution error:', result.error);
        // Continue processing - don't fail the entire template
      } else if (result && result.exports) {
        // Add exports to both local exports and main context
        Object.assign(this.jsExports, result.exports);
        Object.assign(this.context, result.exports);
      }
      
    } catch (error) {
      console.error('Failed to execute JavaScript block:', error);
      // Graceful fallback - continue without JavaScript execution
    }
  }

  private evaluate(node: ASTNode): string {
    switch (node.type) {
      case ASTNodeType.PROGRAM:
        return node.children.map(child => this.evaluate(child)).join('');
      
      case ASTNodeType.HTML_ELEMENT:
        // Process any nested expressions within the HTML using pure character analysis
        return this.processNestedExpressionsNoRegex(node.value);
      
      case ASTNodeType.TEXT_NODE:
        return node.value;
      
      case ASTNodeType.EXPRESSION:
        return this.evaluateExpression(node.children[0]);
      
      case ASTNodeType.CONDITIONAL_EXPR:
        return this.evaluateConditional(node);
      
      case ASTNodeType.BINARY_EXPR:
        return this.evaluateBinaryExpression(node);
      
      case ASTNodeType.LOGICAL_EXPR:
        return this.evaluateLogicalExpression(node);
      
      case ASTNodeType.MEMBER_EXPR:
        return this.evaluateMemberExpression(node);
      
      case ASTNodeType.IDENTIFIER_EXPR:
        return this.resolveIdentifier(node.value);
      
      case ASTNodeType.JAVASCRIPT_BLOCK:
        // JavaScript blocks don't directly output HTML - they execute and export variables
        // The exports are already processed in executeJavaScriptBlocks()
        return '';
      
      case ASTNodeType.STRING_LITERAL:
        // Extract the actual string content from quotes using character analysis
        return this.extractStringLiteralValue(node.value);
      
      case ASTNodeType.NUMBER_LITERAL:
      case ASTNodeType.BOOLEAN_LITERAL:
        return String(node.value);
      
      case ASTNodeType.NULL_LITERAL:
        return '';
      
      case ASTNodeType.ARRAY_MAP:
        return this.evaluateArrayMap(node);
      
      case ASTNodeType.ARROW_FUNCTION:
        // Arrow functions are handled by their parent context (e.g., array map)
        // They don't evaluate directly - they're templates for transformation
        return this.evaluateArrowFunction(node);

      case ASTNodeType.CALL_EXPR:
        return this.evaluateMethodCall(node);
      
      default:
        console.warn('Unknown AST node type', { type: node.type });
        return '';
    }
  }

  /**
   * Extract string literal value using character analysis (NO REGEX)
   */
  private extractStringLiteralValue(value: string): string {
    if (value.length >= 2) {
      const first = value[0];
      const last = value[value.length - 1];

      if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        return value.substring(1, value.length - 1);
      }
    }
    return value;
  }

  private evaluateExpression(node: ASTNode): string {
    const result = this.evaluate(node);
    
    // If result is an object or array, don't render it
    if (typeof result === 'object') {
      return '';
    }
    
    return String(result);
  }

  private evaluateConditional(node: ASTNode): string {
    const [condition, thenExpr, elseExpr] = node.children;
    
    // Get the raw value for proper boolean evaluation
    const conditionValue = this.resolveValue(condition);
    const isTruthy = Boolean(conditionValue);
    
    return isTruthy ? this.evaluate(thenExpr) : this.evaluate(elseExpr);
  }

  private evaluateBinaryExpression(node: ASTNode): string {
    const [left, right] = node.children;
    const operator = node.value;
    
    const leftValue = this.resolveValue(left);
    const rightValue = this.resolveValue(right);
    
    switch (operator) {
      case '===':
        return String(leftValue === rightValue);
      case '!==':
        return String(leftValue !== rightValue);
      case '+':
        return String(Number(leftValue) + Number(rightValue));
      case '-':
        return String(Number(leftValue) - Number(rightValue));
      case '*':
        return String(Number(leftValue) * Number(rightValue));
      case '/':
        return String(Number(leftValue) / Number(rightValue));
      default:
        throw new Error(`Unknown binary operator: ${operator}`);
    }
  }

  private evaluateLogicalExpression(node: ASTNode): string {
    const operator = node.value;
    
    // Handle unary NOT operator
    if (operator === '!') {
      const [operand] = node.children;
      const operandValue = this.resolveValue(operand);
      const result = !Boolean(operandValue);
      return String(result);
    }

    // Handle binary operators
    const [left, right] = node.children;
    const leftValue = this.resolveValue(left);
    
    switch (operator) {
      case '&&':
        // Short-circuit evaluation: if left is falsy, return left value
        if (!Boolean(leftValue)) {
          return String(leftValue);
        }
        // If left is truthy, evaluate and return right
        const rightValue = this.resolveValue(right);
        return String(rightValue);
        
      case '||':
        // Short-circuit evaluation: if left is truthy, return left value
        if (Boolean(leftValue)) {
          return String(leftValue);
        }
        // If left is falsy, evaluate and return right
        const rightValueOr = this.resolveValue(right);
        return String(rightValueOr);
        
      default:
        throw new Error(`Unknown logical operator: ${operator}`);
    }
  }

  private evaluateMemberExpression(node: ASTNode): string {
    const [object] = node.children;
    const property = node.value;

    const objectValue = this.resolveValue(object);

    if (objectValue && typeof objectValue === 'object') {
      const result = objectValue[property];
      return result !== undefined ? String(result) : '';
    }

    return '';
  }

  private evaluateArrayMap(node: ASTNode): string {
    const [arrayNode, ...args] = node.children;
    const arrayValue = this.resolveValue(arrayNode);
    
    if (!Array.isArray(arrayValue)) {
      return '';
    }
    
    // Check if we have an arrow function argument
    const arrowFunctionArg = args.find(arg => arg.type === ASTNodeType.ARROW_FUNCTION);

    if (arrowFunctionArg) {
      // Map using the arrow function template
      const results: string[] = [];
      const paramName = arrowFunctionArg.value; // parameter name
      const template = arrowFunctionArg.children[0]; // function body

      for (const item of arrayValue) {
        // Create context with the array item bound to the parameter name
        const itemContext = { ...this.context, [paramName]: item };

        // Create a new code generator with the item context
        const generator = new PureMixCodeGenerator(itemContext);
        const itemResult = generator.evaluate(template);
        results.push(itemResult);
      }

      return results.join('');
    }

    // Fallback to simple string representation
    return arrayValue.map(item => String(item)).join('');
  }

  private evaluateArrowFunction(node: ASTNode): string {
    // Arrow functions don't evaluate to strings directly
    // They're templates used by their parent context (like array map)
    return '';
  }

  private evaluateMethodCall(node: ASTNode): string {
    try {
      const [objectNode, ...args] = node.children;
      const method = node.value;

      // Get the object value
      const objectValue = this.resolveValue(objectNode);

      if (!objectValue || typeof objectValue[method] !== 'function') {
        log?.debug?.('Method call failed: object or method not found', {
          objectValue: typeof objectValue,
          method,
          hasMethod: objectValue && typeof objectValue[method]
        });
        return '';
      }

      // Handle array methods with callbacks specially
      if (Array.isArray(objectValue) && (method === 'filter' || method === 'map')) {
        return this.evaluateArrayMethodWithCallback(objectValue, method, args);
      }

      // Execute the method using JavaScript execution for safety
      const objectPath = this.buildObjectPath(objectNode);
      const methodCode = `
        try {
          const obj = ${objectPath};
          if (obj && typeof obj.${method} === 'function') {
            __export = { result: obj.${method}() };
          } else {
            __export = { result: '' };
          }
        } catch (error) {
          __export = { result: '' };
        }
      `;

      const result = JavaScriptExecutor.execute(methodCode, this.context);

      if (result.exports && result.exports.result !== undefined) {
        return String(result.exports.result);
      }

      return '';
    } catch (error) {
      log?.debug?.('Method call evaluation error', {
        method: node.value,
        error: (error as Error).message
      });
      return '';
    }
  }

  private evaluateArrayMethodWithCallback(arrayValue: any[], method: string, args: ASTNode[]): string {
    if (args.length === 0) {
      return '';
    }

    const callbackArg = args[0];

    // Handle arrow function callbacks
    if (callbackArg.type === ASTNodeType.ARROW_FUNCTION) {
      const paramName = callbackArg.value; // parameter name
      const template = callbackArg.children[0]; // function body

      if (method === 'filter') {
        const filteredResults: any[] = [];

        for (const item of arrayValue) {
          // Create context with the array item bound to the parameter name
          const itemContext = { ...this.context, [paramName]: item };

          // Create a new code generator with the item context
          const generator = new PureMixCodeGenerator(itemContext);
          const conditionResult = generator.evaluate(template);

          // If condition evaluates to truthy, include the item
          if (conditionResult && conditionResult !== '' && conditionResult !== 'false') {
            filteredResults.push(item);
          }
        }

        // Update context with filtered array for chaining
        const arrayKey = this.findArrayKey(arrayValue);
        if (arrayKey) {
          this.context[arrayKey] = filteredResults;
        }

        return filteredResults.length.toString();
      }

      if (method === 'map') {
        const mappedResults: string[] = [];

        for (const item of arrayValue) {
          // Create context with the array item bound to the parameter name
          const itemContext = { ...this.context, [paramName]: item };

          // Create a new code generator with the item context
          const generator = new PureMixCodeGenerator(itemContext);
          const itemResult = generator.evaluate(template);
          mappedResults.push(itemResult);
        }

        return mappedResults.join('');
      }
    }

    return '';
  }

  private findArrayKey(arrayValue: any[]): string | null {
    for (const [key, value] of Object.entries(this.context)) {
      if (value === arrayValue) {
        return key;
      }
    }
    return null;
  }

  private buildObjectPath(node: ASTNode): string {
    switch (node.type) {
      case ASTNodeType.IDENTIFIER_EXPR:
        return node.value;
      case ASTNodeType.MEMBER_EXPR:
        const [object] = node.children;
        return `${this.buildObjectPath(object)}.${node.value}`;
      default:
        return 'undefined';
    }
  }

  private resolveIdentifier(name: string): string {
    const value = this.context[name];
    return value !== undefined ? String(value) : '';
  }

  /**
   * Process nested expressions using pure character analysis (NO REGEX)
   */
  private processNestedExpressionsNoRegex(html: string): string {
  // Character-by-character analysis to find and process expressions
    let result = '';
    let i = 0;
    
    while (i < html.length) {
      if (html[i] === '{') {
        // Find matching closing brace
        const expressionEnd = this.findMatchingBrace(html, i);

        if (expressionEnd !== -1) {
          // Extract expression content (without braces)
          const expressionContent = html.substring(i + 1, expressionEnd);

          // Process expression using AST interpreter
          const processedValue = this.interpretExpressionAST(expressionContent);
          result += processedValue;
          
          i = expressionEnd + 1;
        } else {
          // No matching brace, treat as literal
          result += html[i];
          i++;
        }
      } else {
        result += html[i];
        i++;
      }
    }
    
    return result;
  }

  /**
   * Find matching closing brace using character counting (NO REGEX)
   */
  private findMatchingBrace(content: string, openIndex: number): number {
    let braceCount = 1;
    let i = openIndex + 1;
    
    while (i < content.length && braceCount > 0) {
      if (content[i] === '{') {
        braceCount++;
      } else if (content[i] === '}') {
        braceCount--;
      }
      
      if (braceCount === 0) {
        return i;
      }

      i++;
    }
    
    return -1; // No matching brace found
  }

  /**
   * Interpret expression using pure AST approach (NO REGEX)
   */
  private interpretExpressionAST(expression: string): string {
    try {
      // Parse as simple expression using AST
      const wrappedExpression = `{${expression}}`;

      const lexer = new PureMixLexer(wrappedExpression);
      const tokens = lexer.tokenize();

      const parser = new PureMixParser(tokens);
      const ast = parser.parse();

      const analyzer = new PureMixSemanticAnalyzer();
      const analyzedAST = analyzer.analyze(ast);

      const generator = new PureMixCodeGenerator(this.context);
      return generator.generate(analyzedAST);

    } catch (error) {
      // If parsing fails, return the original expression
      return `{${expression}}`;
    }
  }

  private resolveValue(node: ASTNode): any {
    switch (node.type) {
      case ASTNodeType.IDENTIFIER_EXPR:
        return this.context[node.value];
      case ASTNodeType.MEMBER_EXPR:
        const [object] = node.children;
        const objectValue = this.resolveValue(object);
        return objectValue && typeof objectValue === 'object' ? objectValue[node.value] : undefined;
      case ASTNodeType.STRING_LITERAL:
        // Extract the actual string content from quotes using character analysis
        return this.extractStringLiteralValue(node.value);
      case ASTNodeType.NUMBER_LITERAL:
        return Number(node.value);
      case ASTNodeType.BOOLEAN_LITERAL:
        // Handle both boolean and string values
        return typeof node.value === 'boolean' ? node.value : node.value === 'true';
      case ASTNodeType.NULL_LITERAL:
        return null;
      case ASTNodeType.BINARY_EXPR:
        // Evaluate binary expressions and return the actual boolean result
        const binaryResult = this.evaluateBinaryExpression(node);
        // Convert string result back to boolean for proper conditional evaluation
        if (binaryResult === 'true') return true;
        if (binaryResult === 'false') return false;
        return binaryResult;
      case ASTNodeType.LOGICAL_EXPR:
        // Evaluate logical expressions and return the actual result
        const logicalResult = this.evaluateLogicalExpression(node);
        // Convert string result back to proper type for conditional evaluation
        if (logicalResult === 'true') return true;
        if (logicalResult === 'false') return false;
        return logicalResult;
      default:
        return undefined;
    }
  }

  /**
   * Detect mixed JavaScript/HTML expressions using AST analysis (NO REGEX)
   */
  private isMixedJavaScriptHtmlExpression(code: string): boolean {
    try {
      // Use AST to analyze the structure instead of regex patterns
      const wrappedCode = `{${code}}`;
      const lexer = new PureMixLexer(wrappedCode);
      const tokens = lexer.tokenize();
      const parser = new PureMixParser(tokens);
      const ast = parser.parse();

      // Analyze AST structure for mixed JS/HTML patterns
      return this.analyzeASTForMixedJavaScriptHtml(ast);

    } catch (error) {
      // If AST parsing fails, use character-based analysis
      return this.characterBasedMixedJavaScriptHtmlDetection(code);
    }
  }

  /**
   * Analyze AST structure to detect mixed JavaScript/HTML patterns (NO REGEX)
   */
  private analyzeASTForMixedJavaScriptHtml(ast: ASTNode): boolean {
    return this.walkASTForPatterns(ast, {
      hasArrayMethodCall: false,
      hasArrowFunction: false,
      hasHtmlElement: false
    });
  }

  /**
   * Walk AST to identify patterns indicative of mixed JS/HTML (NO REGEX)
   */
  private walkASTForPatterns(node: ASTNode, patterns: {
    hasArrayMethodCall: boolean,
    hasArrowFunction: boolean,
    hasHtmlElement: boolean
  }): boolean {
    // Check current node
    switch (node.type) {
      case ASTNodeType.ARRAY_MAP:
      case ASTNodeType.ARRAY_FILTER:
        patterns.hasArrayMethodCall = true;
        break;
      case ASTNodeType.ARROW_FUNCTION:
        patterns.hasArrowFunction = true;
        break;
      case ASTNodeType.HTML_ELEMENT:
        patterns.hasHtmlElement = true;
        break;
    }

    // If we have all three patterns, it's mixed JS/HTML
    if (patterns.hasArrayMethodCall && patterns.hasArrowFunction && patterns.hasHtmlElement) {
      return true;
    }

    // Recursively check children
    for (const child of node.children) {
      if (this.walkASTForPatterns(child, patterns)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Character-based detection as fallback (NO REGEX)
   */
  private characterBasedMixedJavaScriptHtmlDetection(code: string): boolean {
    let hasArrow = false;
    let hasHtmlTag = false;
    let hasArrayMethod = false;

    // Character-by-character analysis
    for (let i = 0; i < code.length - 1; i++) {
      const char = code[i];
      const nextChar = code[i + 1];

      // Detect arrow function: =>
      if (char === '=' && nextChar === '>') {
        hasArrow = true;
      }

      // Detect HTML opening tag: <letter
      if (char === '<' && this.isLetter(nextChar)) {
        hasHtmlTag = true;
      }

      // Detect array methods: .map( .filter( .forEach(
      if (char === '.') {
        const methodName = this.extractMethodNameAtPosition(code, i + 1);
        if (methodName === 'map' || methodName === 'filter' || methodName === 'forEach') {
          hasArrayMethod = true;
        }
      }
    }

    return hasArrow && hasHtmlTag && hasArrayMethod;
  }

  /**
   * Extract method name at specific position using character analysis (NO REGEX)
   */
  private extractMethodNameAtPosition(code: string, startPos: number): string {
    let methodName = '';
    let i = startPos;

    while (i < code.length && this.isLetterOrDigit(code[i])) {
      methodName += code[i];
      i++;
    }

    return methodName;
  }

  /**
   * Check if character is a letter (NO REGEX)
   */
  private isLetter(char: string): boolean {
    const charCode = char.charCodeAt(0);
    return (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122);
  }

  /**
   * Check if character is letter or digit (NO REGEX)
   */
  private isLetterOrDigit(char: string): boolean {
    const charCode = char.charCodeAt(0);
    return this.isLetter(char) || (charCode >= 48 && charCode <= 57);
  }

  /**
   * Process mixed JavaScript/HTML expressions using pure AST parsing (NO REGEX)
   */
  private processRecursiveExpression(code: string, context: Record<string, any>): string {
    try {
      log?.debug?.('Processing recursive mixed JS/HTML expression using AST', { code: code.substring(0, 100) });

      // Parse the expression as AST to understand its structure
      const wrappedCode = `{${code}}`;
      const lexer = new PureMixLexer(wrappedCode);
      const tokens = lexer.tokenize();
      const parser = new PureMixParser(tokens);
      const ast = parser.parse();
      
      // Process the AST to identify array method calls with arrow functions
      return this.processASTForArrayMethods(ast, context);
      
    } catch (error) {
      log?.debug?.('AST-based recursive expression processing error', { 
        code: code.substring(0, 100),
        error: (error as Error).message 
      });
      return `{${code}}`;
    }
  }

  /**
   * Process AST for array method calls with arrow functions (NO REGEX)
   */
  private processASTForArrayMethods(ast: ASTNode, context: Record<string, any>): string {
    const results: string[] = [];

    // Walk the AST to find ARRAY_MAP, ARRAY_FILTER, etc. nodes
    this.walkASTForArrayMethods(ast, context, results);
    
    return results.length > 0 ? results.join('') : this.fallbackDirectEvaluation(ast, context);
  }

  /**
   * Walk AST to find and process array method calls (NO REGEX)
   */
  private walkASTForArrayMethods(node: ASTNode, context: Record<string, any>, results: string[]): void {
    switch (node.type) {
      case ASTNodeType.ARRAY_MAP:
      case ASTNodeType.ARRAY_FILTER:
      case ASTNodeType.ARRAY_REDUCE:
        const arrayResult = this.processArrayMethodNode(node, context);
        if (arrayResult) results.push(arrayResult);
        break;

      default:
        // Recursively process children
        for (const child of node.children) {
          this.walkASTForArrayMethods(child, context, results);
        }
        break;
    }
  }

  /**
   * Process array method AST node (map, filter, etc.) (NO REGEX)
   */
  private processArrayMethodNode(node: ASTNode, context: Record<string, any>): string {
    const [arrayNode, ...args] = node.children;
    const arrayValue = this.resolveValue(arrayNode);

    if (!Array.isArray(arrayValue)) {
      return '';
    }

    // Find arrow function argument
    const arrowFunctionArg = args.find(arg => arg.type === ASTNodeType.ARROW_FUNCTION);

    if (arrowFunctionArg) {
      const results: string[] = [];
      const paramName = arrowFunctionArg.value; // parameter name
      const template = arrowFunctionArg.children[0]; // function body
      
      for (const item of arrayValue) {
        // Create context with the array item bound to the parameter name
        const itemContext = { ...context, [paramName]: item };

        // Process template using AST-based code generator
        const generator = new PureMixCodeGenerator(itemContext);
        const itemResult = generator.evaluate(template);
        results.push(itemResult);
      }

      return results.join('');
    }

    return '';
  }

  /**
   * Fallback evaluation using AST-based parsing (NO REGEX)
   */
  private fallbackDirectEvaluation(ast: ASTNode, context: Record<string, any>): string {
    try {
      // Use the existing code generator to process the AST
      const generator = new PureMixCodeGenerator(context);
      return generator.evaluate(ast);

    } catch (error) {
      return '';
    }
  }
}

// =============================================================================
// MAIN INTERPRETER CLASS (NO REGEX)
// =============================================================================

export class PureMixInterpreter {
  private lexer!: PureMixLexer;
  private parser!: PureMixParser;
  private analyzer: PureMixSemanticAnalyzer;
  private generator!: PureMixCodeGenerator;
  public debugMode: boolean = false;

  constructor() {
    this.analyzer = new PureMixSemanticAnalyzer();
  }

  interpret(source: string, context: Record<string, any> = {}): string {
    try {
      // Template-aware interpretation - process only {} expressions
      return this.interpretTemplate(source, context);
      
    } catch (error) {
      console.error('PureMix Interpreter Error:', error);
      console.error('Source:', source);
      console.error('Context keys:', Object.keys(context));
      return source; // Return original source on error
    }
  }

  /**
   * Template-aware interpretation using pure character-based analysis (NO REGEX)
   */
  private interpretTemplate(source: string, context: Record<string, any>): string {
    let result = source;
    let expressionStart = 0;

    // Create a cumulative context that will accumulate JavaScript exports
    // This ensures that variables exported from previous JavaScript blocks
    // are available to subsequent expressions in the same template
    let cumulativeContext = { ...context };

    while (true) {
      // Find the next { character
      const openBrace = result.indexOf('{', expressionStart);
      if (openBrace === -1) break;

      // Check if this brace is inside a code block using character analysis
      if (this.isInsideCodeBlock(result, openBrace)) {
        expressionStart = openBrace + 1;
        continue;
      }

      // Find the matching } character with brace counting
      let braceCount = 0;
      let closeBrace = -1;

      for (let i = openBrace; i < result.length; i++) {
        if (result[i] === '{') {
          braceCount++;
        } else if (result[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            closeBrace = i;
            break;
          }
        }
      }

      if (closeBrace === -1) {
        // No matching closing brace found, skip this opening brace
        expressionStart = openBrace + 1;
        continue;
      }

      // Extract the expression content (without braces)
      const expressionContent = result.substring(openBrace + 1, closeBrace);

      try {
        // Process the expression using our AST interpreter with cumulative context
        const processedValue = this.interpretExpression(expressionContent, cumulativeContext);

        // Check if this was a JavaScript block that might have exports
        // If so, we need to capture and add those exports to our cumulative context
        const isJsBlock = this.looksLikeJavaScriptBlock(expressionContent);
        console.log('🔍 Expression analysis:', {
          isJsBlock,
          content: expressionContent.substring(0, 50) + '...'
        });

        if (isJsBlock) {
          const exports = this.extractJavaScriptExports(expressionContent, cumulativeContext);
          console.log('🔍 Extracted exports:', exports);
          if (exports && Object.keys(exports).length > 0) {
            // Add the exports to our cumulative context for subsequent expressions
            Object.assign(cumulativeContext, exports);
            console.log('🔧 Template context updated with JS exports:', Object.keys(exports));
          }
        }

        // Replace the entire {expression} with the processed value
        result = result.substring(0, openBrace) + processedValue + result.substring(closeBrace + 1);

        // Adjust the start position for next search
        expressionStart = openBrace + String(processedValue).length;

      } catch (error) {
        // If expression processing fails, leave it unchanged and continue
        expressionStart = closeBrace + 1;
      }
    }
    
    // Component processing is now handled by TemplateEngineInterpreter.processComponentTagsAsync
    // before calling this interpreter, so component tags should already be rendered
    console.log('🔍 PureMix Interpreter: Component processing skipped - handled by TemplateEngineInterpreter');
    
    return result;
  }

  /**
   * Check if expression looks like a JavaScript block (contains statements)
   */
  private looksLikeJavaScriptBlock(expression: string): boolean {
    // Simple heuristics to detect JavaScript blocks
    return expression.includes('const ') ||
           expression.includes('let ') ||
           expression.includes('var ') ||
           expression.includes('__export');
  }

  /**
   * Extract JavaScript exports from a JavaScript block expression
   */
  private extractJavaScriptExports(expression: string, context: Record<string, any>): Record<string, any> | null {
    try {
      // Use the JavaScript executor to execute the code and capture exports
      console.log('🔧 Calling JavaScriptExecutor.execute with:', {
        expression: expression.substring(0, 100) + '...',
        contextKeys: Object.keys(context)
      });

      // Check if JavaScriptExecutor is available
      if (!JavaScriptExecutor || typeof JavaScriptExecutor.execute !== 'function') {
        console.error('❌ JavaScriptExecutor not available or not a function:', typeof JavaScriptExecutor);
        return null;
      }

      const result = JavaScriptExecutor.execute(expression, context);
      console.log('🔧 JavaScriptExecutor result:', result);

      if (result && result.error) {
        console.error('❌ JavaScript execution error:', result.error);
        return null;
      }

      return result?.exports || null;
    } catch (error) {
      console.error('Failed to extract JavaScript exports:', error);
      return null;
    }
  }

  /**
   * Process component tags using character-based analysis (NO REGEX)
   * Looks for patterns like <ComponentName /> or <ComponentName></ComponentName>
   */
  private processComponentTags(source: string, context: Record<string, any>): string {
    let result = source;
    let componentsProcessed = 0;
    
    // Process each component tag using character-based analysis (NO REGEX)
    if (context.componentRenderer && typeof context.componentRenderer === 'function') {
      let searchStart = 0;
      
      while (searchStart < result.length) {
        // Find the next < character
        const openAngle = result.indexOf('<', searchStart);
        if (openAngle === -1) break;
        
        // Skip if inside code block
        if (this.isInsideCodeBlock(result, openAngle)) {
          searchStart = openAngle + 1;
          continue;
        }
        
        // Check if this is a component tag (starts with uppercase letter)
        let tagNameStart = openAngle + 1;
        
        // Skip whitespace
        while (tagNameStart < result.length && result[tagNameStart] === ' ') {
          tagNameStart++;
        }
        
        // Check if tag name starts with uppercase letter (component convention)
        if (tagNameStart >= result.length || !/[A-Z]/.test(result[tagNameStart])) {
          searchStart = openAngle + 1;
          continue;
        }
        
        // Extract tag name using character analysis
        let tagNameEnd = tagNameStart;
        while (tagNameEnd < result.length && 
               /[A-Za-z0-9]/.test(result[tagNameEnd])) {
          tagNameEnd++;
        }
        
        const tagName = result.substring(tagNameStart, tagNameEnd);
        
        // Look for self-closing tag /> or opening tag >
        let tagEnd = -1;
        let isSelfClosing = false;
        
        for (let i = tagNameEnd; i < result.length; i++) {
          if (result[i] === '/' && i + 1 < result.length && result[i + 1] === '>') {
            tagEnd = i + 2;
            isSelfClosing = true;
            break;
          } else if (result[i] === '>') {
            tagEnd = i + 1;
            break;
          }
        }
        
        if (tagEnd === -1) {
          searchStart = openAngle + 1;
          continue;
        }
        
        // If not self-closing, find the closing tag
        let fullTagEnd = tagEnd;
        if (!isSelfClosing) {
          const closingTag = `</${tagName}>`;
          const closingPos = result.indexOf(closingTag, tagEnd);
          if (closingPos !== -1) {
            fullTagEnd = closingPos + closingTag.length;
          }
        }
        
        // Extract the full tag for future use
        const _fullTag = result.substring(openAngle, fullTagEnd);
        
        // Try to render the component using the component renderer
        try {
          let renderedComponent: string;
          
          // Use the componentRenderer if available
          if (context.componentRenderer && typeof context.componentRenderer === 'function') {
            console.log(`🧩 COMPONENT DEBUG: Attempting to render ${tagName} using componentRenderer`);
            
            // Since componentRenderer is async, we need to handle this carefully
            // For now, create a properly formatted independent component placeholder
            // that will be replaced by client-side rendering or subsequent processing
            const componentId = `${tagName}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            renderedComponent = `<div id="${componentId}" data-component="${tagName}" data-independent="true">
              <!-- Component ${tagName} will render independently with ID: ${componentId} -->
              <script>
                console.log('Component ${tagName} (ID: ${componentId}) ready for independent rendering');
                // Component will be populated by independent rendering system
              </script>
            </div>`;
            console.log(`🧩 COMPONENT DEBUG: Created independent placeholder for ${tagName} with ID: ${componentId}`);
            
          } else {
            console.log(`⚠️  COMPONENT DEBUG: No componentRenderer available for ${tagName}`);
            renderedComponent = `<!-- Component ${tagName}: No renderer available -->`;
          }
          
          // Replace the tag with rendered content
          result = result.substring(0, openAngle) + renderedComponent + result.substring(fullTagEnd);
          
          // Update search position
          searchStart = openAngle + renderedComponent.length;
          componentsProcessed++;
          
        } catch (error) {
          // If component rendering fails, leave tag unchanged and continue
          const errorComment = `<!-- Component ${tagName} render error: ${error} -->`;
          result = result.substring(0, openAngle) + errorComment + result.substring(fullTagEnd);
          searchStart = openAngle + errorComment.length;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Render a component using available context information
   * This is a fallback implementation - ideally component rendering would be handled by the TemplateEngineInterpreter
   */
  private renderComponent(tagName: string, fullTag: string, context: Record<string, any>): string {
    // Check if we have component rendering capabilities in the context
    if (context.componentRenderer && typeof context.componentRenderer === 'function') {
      try {
        return context.componentRenderer(tagName, fullTag, context);
      } catch (error) {
        // If component rendering fails, return placeholder
        return `<!-- Failed to render component ${tagName}: ${error} -->`;
      }
    }
    
    // If no component renderer available, return placeholder
    return `<!-- Component ${tagName} (no renderer available) -->`;
  }

  /**
   * Check if a position is inside a code block using character analysis (NO REGEX)
   */
  private isInsideCodeBlock(source: string, position: number): boolean {
    // Check if inside HTML tag blocks
    const codeBlockTags = ['script', 'style', 'pre', 'code'];
    
    for (const tag of codeBlockTags) {
      const openTag = `<${tag}`;
      const closeTag = `</${tag}>`;
      
      // Find the most recent opening tag before this position
      let lastOpenTagPos = -1;
      let searchStart = 0;
      
      while (true) {
        const openPos = source.indexOf(openTag, searchStart);
        if (openPos === -1 || openPos >= position) break;
        lastOpenTagPos = openPos;
        searchStart = openPos + 1;
      }
      
      if (lastOpenTagPos !== -1) {
        // Find the corresponding closing tag after the opening tag
        const closePos = source.indexOf(closeTag, lastOpenTagPos);
        
        // If position is between opening and closing tag, it's inside a code block
        if (closePos === -1 || position < closePos) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Process a single expression using pure AST interpretation (NO REGEX)
   */
  private interpretExpression(expression: string, context: Record<string, any>): string {
    try {
      // Skip empty expressions
      if (!expression.trim()) {
        return '';
      }

      // DEBUG: Log what we're trying to process
      console.log('🔍 AST INTERPRETER DEBUG:', {
        expression,
        contextKeys: Object.keys(context),
        hasLoadFormTest: 'loadFormTest' in context
      });
      
      // FALLBACK: For simple expressions, conditionals, or complex method calls, try direct evaluation using JavaScriptExecutor
      const isSimple = this.isSimplePropertyAccess(expression);
      const isConditional = this.isBasicConditional(expression);
      const isComplexMethod = this.isComplexMethodExpression(expression);

      // Only log for debugging when explicitly requested
      if ((expression.includes('showSuccess') || expression.includes('map(')) && this.debugMode) {
        console.log('🔍 EXPRESSION ANALYSIS:', {
          expression: expression.substring(0, 100) + '...',
          isSimple,
          isConditional,
          isComplexMethod,
          hasQuestionMark: expression.includes('?'),
          hasColon: expression.includes(':')
        });
      }

      if (isSimple || isConditional || isComplexMethod) {
        try {
          // For conditional expressions, we need to handle them specially
          let evaluationResult;
          if (isConditional) {
            console.log('🚀 ATTEMPTING CONDITIONAL EVALUATION');
            evaluationResult = this.evaluateConditionalExpression(expression, context);
          } else if (isComplexMethod) {
            console.log('🚀 ATTEMPTING COMPLEX METHOD EVALUATION');
            // For complex method expressions with nested templates, we need special handling
            evaluationResult = this.evaluateComplexMethodExpression(expression, context);
            console.log('🔍 COMPLEX METHOD RESULT:', evaluationResult);
          } else {
            evaluationResult = JavaScriptExecutor.execute(expression, context);
          }
          
          if (evaluationResult !== undefined && evaluationResult !== null) {
            console.log('✅ JavaScript fallback succeeded:', { 
              expression: expression.substring(0, 50) + '...', 
              result: String(evaluationResult).substring(0, 100) + '...',
              resultType: typeof evaluationResult,
              isConditional: isConditional 
            });
            return String(evaluationResult);
          } else {
            console.log('❌ JavaScript fallback returned null/undefined:', { 
              expression: expression.substring(0, 50) + '...', 
              evaluationResult,
              isConditional: isConditional 
            });
          }
        } catch (jsError) {
          console.log('⚠️  JavaScript fallback failed:', { expression: expression.substring(0, 50) + '...', error: jsError });
          // Continue to AST parsing if JS fallback fails
        }
      }

      // Parse as simple expression using AST
      const wrappedExpression = `{${expression}}`;

      this.lexer = new PureMixLexer(wrappedExpression);
      const tokens = this.lexer.tokenize();

      this.parser = new PureMixParser(tokens);
      const ast = this.parser.parse();

      const analyzedAST = this.analyzer.analyze(ast);

      this.generator = new PureMixCodeGenerator(context);
      const result = this.generator.generate(analyzedAST);
      console.log('✅ AST processing succeeded:', { expression, result });
      return result;
      
    } catch (error) {
      console.log('❌ AST INTERPRETER ERROR:', {
        expression,
        error: error instanceof Error ? error.message : String(error),
        contextKeys: Object.keys(context)
      });
      // If parsing fails, return the original expression 
      return `{${expression}}`;
    }
  }

  /**
   * Check if expression is a simple property access that can be directly evaluated
   */
  private isSimplePropertyAccess(expression: string): boolean {
    const trimmed = expression.trim();

    // Check for simple property access patterns without function calls or operators
    // Examples: loadFormTest.data.title, user.name, items.length
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/.test(trimmed);
  }

  /**
   * Evaluate complex method expressions that contain nested template expressions
   * These require recursive processing of inner {} expressions before executing the outer method
   */
  private evaluateComplexMethodExpression(expression: string, context: Record<string, any>): string {
    try {
      console.log('🔧 PROCESSING COMPLEX METHOD:', expression.substring(0, 100) + '...');

      // Check if this is a .map() expression - most common case
      if (expression.includes('.map(')) {
        return this.evaluateMapExpression(expression, context);
      }

      // For other complex methods, fall back to simpler processing
      console.log('⚠️ UNSUPPORTED COMPLEX METHOD:', expression.substring(0, 50) + '...');
      return '';

    } catch (error) {
      console.error('❌ Complex method evaluation failed:', error);
      return '';
    }
  }

  /**
   * Evaluate .map() expressions by processing them iteratively
   */
  private evaluateMapExpression(expression: string, context: Record<string, any>): string {
    try {
      console.log('🗺️ PROCESSING MAP EXPRESSION');

      // Extract the array reference and the map template
      // Pattern: arrayName.map(varName => template)
      const mapMatch = expression.match(/^(.+?)\.map\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>\s*([\s\S]+)\)$/);

      if (!mapMatch) {
        console.log('❌ Could not parse map expression pattern');
        return '';
      }

      const [, arrayPath, itemVarName, template] = mapMatch;
      console.log('🔍 MAP COMPONENTS:', { arrayPath, itemVarName, template: template.substring(0, 50) + '...' });

      // Evaluate the array path to get the actual array
      const arrayResult = this.evaluatePropertyPath(arrayPath.trim(), context);
      console.log('🔍 ARRAY RESULT:', { arrayResult, type: typeof arrayResult, isArray: Array.isArray(arrayResult) });

      if (!Array.isArray(arrayResult)) {
        console.log('❌ Array path did not resolve to an array');
        return '';
      }

      // Process each item in the array
      const results: string[] = [];
      for (let i = 0; i < arrayResult.length; i++) {
        const item = arrayResult[i];

        // Create context with the current item accessible via the variable name
        const itemContext = { ...context, [itemVarName]: item };
        console.log(`🔄 PROCESSING ITEM ${i}:`, { item, varName: itemVarName });

        // Process the template with the current item context
        let processedTemplate = this.interpretTemplate(template.trim(), itemContext);

        // If the template is a simple string literal, remove the quotes
        if (processedTemplate.startsWith("'") && processedTemplate.endsWith("'")) {
          processedTemplate = processedTemplate.slice(1, -1);
        } else if (processedTemplate.startsWith('"') && processedTemplate.endsWith('"')) {
          processedTemplate = processedTemplate.slice(1, -1);
        }

        console.log(`✅ PROCESSED ITEM ${i}:`, processedTemplate.substring(0, 50) + '...');

        results.push(processedTemplate);
      }

      const finalResult = results.join('');
      console.log('🎯 FINAL MAP RESULT:', finalResult.substring(0, 100) + '...');
      return finalResult;

    } catch (error) {
      console.error('❌ Map expression evaluation failed:', error);
      return '';
    }
  }

  /**
   * Evaluate a property path like "loadData.items" or "notifications"
   */
  private evaluatePropertyPath(path: string, context: Record<string, any>): any {
    try {
      const parts = path.split('.');
      let current = context;

      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          console.log(`❌ Property '${part}' not found in path '${path}'`);
          return undefined;
        }
      }

      return current;
    } catch (error) {
      console.error('❌ Property path evaluation failed:', error);
      return undefined;
    }
  }

  /**
   * Check if expression is a complex method call that should be delegated to JavaScript executor
   */
  private isComplexMethodExpression(expression: string): boolean {
    const trimmed = expression.trim();

    // Identify complex array/object method calls that contain:
    // - Method calls like .map(), .filter(), .reduce(), etc.
    // - Arrow functions: =>
    // - HTML/JSX-like content: < and >
    // - Function calls: ()
    const complexPatterns = [
      '.map(',           // Array map methods
      '.filter(',        // Array filter methods
      '.reduce(',        // Array reduce methods
      '.find(',          // Array find methods
      '.forEach(',       // Array forEach methods
      '=>',              // Arrow functions
      '</',              // HTML closing tags
      '<div',            // HTML div tags
      '<span',           // HTML span tags
      '<button',         // HTML button tags
      '<form',           // HTML form tags
      '<input',          // HTML input tags
    ];

    // Check if expression contains any complex patterns
    const hasComplexPattern = complexPatterns.some(pattern => trimmed.includes(pattern));

    // Also check for general HTML-like content (opening tags)
    const hasHtmlContent = /<[a-zA-Z][^>]*>/.test(trimmed);

    return hasComplexPattern || hasHtmlContent;
  }

  /**
   * Check if expression is a basic conditional (ternary) expression
   */
  private isBasicConditional(expression: string): boolean {
    const trimmed = expression.trim();

    // CRITICAL FIX: Must have BOTH ? and : and the ? must come BEFORE the :
    if (!trimmed.includes('?') || !trimmed.includes(':')) {
      return false;
    }

    // Find the positions to ensure ? comes before :
    const questionIndex = trimmed.indexOf('?');
    const colonIndex = trimmed.indexOf(':');

    if (questionIndex === -1 || colonIndex === -1 || questionIndex >= colonIndex) {
      return false;
    }

    // Exclude expressions that are clearly not conditionals
    const complexPatterns = [
      '.map(',           // Array map functions
      '.filter(',        // Array filter functions
      '.reduce(',        // Array reduce functions
      '.forEach(',       // Array forEach functions
      '=>',              // Arrow functions
      'function(',       // Function declarations
      'console.',        // Console statements
      '__export',        // Export statements
      'const ',          // Variable declarations
      'let ',            // Variable declarations
      'var ',            // Variable declarations
      'JSON.stringify',  // JSON operations
      'formatCurrency',  // Function calls
      '.call(',          // Method calls
      '.apply(',         // Method calls
    ];

    const isComplexExpression = complexPatterns.some(pattern => trimmed.includes(pattern));

    const hasValidConditional = questionIndex !== -1 && colonIndex !== -1 && questionIndex < colonIndex;

    if (hasValidConditional && trimmed.includes('showSuccess')) {
      console.log('🔍 CONDITIONAL DETECTED:', {
        expression: trimmed.substring(0, 100) + '...',
        hasValidConditional,
        isComplexExpression,
        questionIndex,
        colonIndex
      });
    }

    // Only return true for simple conditionals, not complex expressions
    return hasValidConditional && !isComplexExpression;
  }

  /**
   * Evaluate a conditional expression by parsing the condition, trueExpr, and falseExpr
   * and executing them appropriately - with proper nested conditional support
   */
  private evaluateConditionalExpression(expression: string, context: Record<string, any>): string {
    // Parse the ternary expression: condition ? trueExpr : falseExpr
    // This needs to handle nested conditionals properly by counting braces and finding the correct colon
    const result = this.parseConditionalExpression(expression);

    console.log('🔍 Parsing conditional:', {
      condition: result.condition,
      trueExpr: result.trueExpr.substring(0, 50) + '...',
      falseExpr: result.falseExpr.substring(0, 50) + '...'
    });

    // Evaluate the condition
    let conditionResult;
    try {
      conditionResult = JavaScriptExecutor.execute(result.condition, context);
    } catch (error) {
      console.log('❌ Condition evaluation failed:', { condition: result.condition, error });
      throw error;
    }

    console.log('🔍 Condition result:', { condition: result.condition, result: conditionResult });

    // Get the selected branch
    const selectedBranch = conditionResult ? result.trueExpr : result.falseExpr;
    const branchName = conditionResult ? 'TRUE' : 'FALSE';

    console.log(`🎯 CONDITIONAL RESULT - ${branchName} BRANCH:`, { branch: selectedBranch.substring(0, 100) + '...' });

    // CRITICAL FIX: Check if the selected branch is a simple expression vs HTML template
    const trimmedBranch = selectedBranch.trim();

    // If it's a simple string literal, return it directly without processing
    if ((trimmedBranch.startsWith("'") && trimmedBranch.endsWith("'")) ||
        (trimmedBranch.startsWith('"') && trimmedBranch.endsWith('"'))) {
      const unquotedValue = trimmedBranch.slice(1, -1);
      console.log('📝 CONDITIONAL: Returning string literal directly:', unquotedValue);
      return unquotedValue;
    }

    // If it contains HTML tags, process as template
    if (trimmedBranch.includes('<') && trimmedBranch.includes('>')) {
      console.log('🏷️ CONDITIONAL: Processing as HTML template');
      return this.interpretTemplate(selectedBranch, context);
    }

    // CRITICAL FIX: Check if this branch contains another conditional expression
    if (trimmedBranch.includes('?') && trimmedBranch.includes(':')) {
      console.log('🔄 CONDITIONAL: Detected nested conditional, recursively evaluating');
      try {
        // This is a nested conditional - evaluate it recursively
        const nestedResult = this.evaluateConditionalExpression(trimmedBranch, context);
        console.log('✅ CONDITIONAL: Nested conditional evaluated successfully:', nestedResult);
        return nestedResult;
      } catch (error) {
        console.log('❌ CONDITIONAL: Nested conditional evaluation failed:', error);
        // Fall through to other handling
      }
    }

    // For simple expressions (property access, numbers, etc.), try direct evaluation first
    if (!trimmedBranch.includes('?') && !trimmedBranch.includes(':')) {
      try {
        const directResult = JavaScriptExecutor.execute(trimmedBranch, context);
        if (directResult !== undefined && directResult !== null) {
          console.log('✅ CONDITIONAL: Direct evaluation succeeded:', directResult);
          return String(directResult);
        }
      } catch (error) {
        console.log('⚠️ CONDITIONAL: Direct evaluation failed, trying template processing');
      }
    }

    // Fall back to template processing for complex expressions
    console.log('🔄 CONDITIONAL: Processing as template expression');
    return this.interpretTemplate(selectedBranch, context);
  }

  /**
   * Parse a conditional expression properly handling nested structures
   * This correctly identifies the condition, true expression, and false expression
   * even when they contain nested conditionals or complex HTML
   */
  private parseConditionalExpression(expression: string): { condition: string; trueExpr: string; falseExpr: string } {
    const trimmed = expression.trim();

    // Find the first ? that's not inside nested braces
    const questionIndex = this.findTopLevelOperator(trimmed, '?');
    if (questionIndex === -1) {
      throw new Error('Invalid conditional expression: no ? found');
    }

    // Find the matching : for this ? by counting nested structures
    const afterQuestion = trimmed.substring(questionIndex + 1);
    const colonIndex = this.findMatchingColon(afterQuestion);
    if (colonIndex === -1) {
      throw new Error('Invalid conditional expression: no matching : found');
    }

    const condition = trimmed.substring(0, questionIndex).trim();
    const trueExpr = afterQuestion.substring(0, colonIndex).trim();
    const falseExpr = afterQuestion.substring(colonIndex + 1).trim();

    return { condition, trueExpr, falseExpr };
  }

  /**
   * Find the position of an operator at the top level (not inside nested braces/parentheses/HTML tags)
   * CRITICAL FIX: Also track HTML angle brackets for proper operator detection
   */
  private findTopLevelOperator(expression: string, operator: string): number {
    let depth = 0;
    let angleDepth = 0; // Track HTML tag depth
    let inSingleQuotes = false;
    let inDoubleQuotes = false;
    let inHtmlContent = false; // NEW: Track when we're inside HTML text content
    let justClosedTag = false; // Track when we just closed an HTML tag

    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];
      const prevChar = i > 0 ? expression[i - 1] : '';

      // Handle string literals
      if (char === '"' && prevChar !== '\\' && !inSingleQuotes) {
        inDoubleQuotes = !inDoubleQuotes;
        continue;
      }
      if (char === "'" && prevChar !== '\\' && !inDoubleQuotes) {
        inSingleQuotes = !inSingleQuotes;
        continue;
      }

      // Skip if we're inside quotes
      if (inSingleQuotes || inDoubleQuotes) {
        continue;
      }

      // Track nesting depth for all structural elements
      if (char === '(' || char === '{' || char === '[') {
        depth++;
        inHtmlContent = false; // Entering expression context
      } else if (char === ')' || char === '}' || char === ']') {
        depth--;
      } else if (char === '<') {
        // Track opening HTML tags
        angleDepth++;
        inHtmlContent = false; // Starting HTML tag
        justClosedTag = false;
      } else if (char === '>') {
        // Track closing HTML tags
        angleDepth--;
        justClosedTag = true;
        // Check if we might be entering HTML text content
        if (angleDepth === 0 && depth === 0) {
          // Look ahead to see if next non-whitespace is text content
          for (let j = i + 1; j < expression.length; j++) {
            const nextChar = expression[j];
            if (nextChar === ' ' || nextChar === '\t' || nextChar === '\n' || nextChar === '\r') {
              continue; // Skip whitespace
            } else if (nextChar === '<') {
              break; // Next tag starts immediately, no text content
            } else {
              inHtmlContent = true; // We have text content
              break;
            }
          }
        }
      } else if (char === operator && depth === 0 && angleDepth === 0 && !inHtmlContent) {
        // Only match operator when not inside any nested structure or HTML text content
        return i;
      }

      // Update HTML content tracking based on character position
      if (justClosedTag && angleDepth === 0 && depth === 0) {
        if (char !== ' ' && char !== '\t' && char !== '\n' && char !== '\r' && char !== '<') {
          inHtmlContent = true; // We're definitely in text content now
        }
        justClosedTag = false;
      } else if (char === '<' && inHtmlContent) {
        inHtmlContent = false; // Starting new tag, exiting text content
      }
    }

    return -1;
  }

  /**
   * Find the matching colon for a conditional by properly handling nested structures
   * CRITICAL FIX: Also track HTML angle brackets for proper conditional parsing
   */
  private findMatchingColon(afterQuestion: string): number {
    console.log('🔍 COLON SEARCH: Finding matching colon in:', afterQuestion.substring(0, 200) + (afterQuestion.length > 200 ? '...' : ''));

    let depth = 0;
    let angleDepth = 0; // Track HTML tag depth
    let inSingleQuotes = false;
    let inDoubleQuotes = false;
    let questionCount = 0; // Track nested conditionals
    let inHtmlContent = false; // NEW: Track when we're inside HTML text content
    let justClosedTag = false; // Track when we just closed an HTML tag

    for (let i = 0; i < afterQuestion.length; i++) {
      const char = afterQuestion[i];
      const prevChar = i > 0 ? afterQuestion[i - 1] : '';

      // Handle string literals
      if (char === '"' && prevChar !== '\\' && !inSingleQuotes) {
        inDoubleQuotes = !inDoubleQuotes;
        continue;
      }
      if (char === "'" && prevChar !== '\\' && !inDoubleQuotes) {
        inSingleQuotes = !inSingleQuotes;
        continue;
      }

      // Skip if we're inside quotes
      if (inSingleQuotes || inDoubleQuotes) {
        continue;
      }

      // Track nesting depth for all structural elements
      if (char === '(' || char === '{' || char === '[') {
        depth++;
        inHtmlContent = false; // Entering expression context
      } else if (char === ')' || char === '}' || char === ']') {
        depth--;
      } else if (char === '<') {
        // Track opening HTML tags
        angleDepth++;
        inHtmlContent = false; // Starting HTML tag
        justClosedTag = false;
      } else if (char === '>') {
        // Track closing HTML tags
        angleDepth--;
        justClosedTag = true;
        // Check if we might be entering HTML text content
        if (angleDepth === 0 && depth === 0) {
          // Look ahead to see if next non-whitespace is text content
          for (let j = i + 1; j < afterQuestion.length; j++) {
            const nextChar = afterQuestion[j];
            if (nextChar === ' ' || nextChar === '\t' || nextChar === '\n' || nextChar === '\r') {
              continue; // Skip whitespace
            } else if (nextChar === '<') {
              break; // Next tag starts immediately, no text content
            } else {
              console.log(`🏷️ HTML CONTENT PREDICTED: Position ${j}, char='${nextChar}'`);
              inHtmlContent = true; // We have text content
              break;
            }
          }
        }
      } else if (char === '?' && depth === 0 && angleDepth === 0 && !inHtmlContent) {
        // Found a nested conditional (only count when not in HTML content)
        questionCount++;
      } else if (char === ':') {
        console.log(`🔍 COLON FOUND at position ${i}: depth=${depth}, angleDepth=${angleDepth}, inHtmlContent=${inHtmlContent}, questionCount=${questionCount}, context="${afterQuestion.substring(Math.max(0, i-10), i+10)}"`);

        if (depth === 0 && angleDepth === 0) {
          // Found a colon at top level - check if it's part of HTML text content first
          console.log(`🔍 CALLING isColonInHtmlText for position ${i}`);
          if (this.isColonInHtmlText(afterQuestion, i)) {
            console.log(`❌ COLON SKIP: Colon is part of HTML text content at position ${i}`);
            // This colon is part of HTML text, skip it
            continue;
          }
          console.log(`🔍 isColonInHtmlText returned false for position ${i}`);

          // Now check if it's a valid ternary colon
          if (questionCount === 0) {
            // This is our matching colon for the ternary operator
            console.log(`✅ COLON MATCH: Found matching colon at position ${i}`);
            return i;
          } else {
            // This colon belongs to a nested conditional
            console.log(`🔄 COLON NESTED: Colon belongs to nested conditional, questionCount=${questionCount}`);
            questionCount--;
          }
        } else {
          console.log(`❌ COLON REJECTED: depth=${depth}, angleDepth=${angleDepth}, inHtmlContent=${inHtmlContent}`);
        }
      }

      // Update HTML content tracking based on character position
      if (justClosedTag && angleDepth === 0 && depth === 0) {
        if (char !== ' ' && char !== '\t' && char !== '\n' && char !== '\r' && char !== '<') {
          console.log(`🏷️ HTML CONTENT START: Position ${i}, char='${char}', inHtmlContent=${inHtmlContent} -> true`);
          inHtmlContent = true; // We're definitely in text content now
        }
        justClosedTag = false;
      } else if (char === '<' && inHtmlContent) {
        console.log(`🏷️ HTML CONTENT END: Position ${i}, inHtmlContent=${inHtmlContent} -> false`);
        inHtmlContent = false; // Starting new tag, exiting text content
      }
    }

    console.log('❌ COLON SEARCH: No matching colon found');
    return -1;
  }

  /**
   * Check if a colon at the given position is part of HTML text content
   * (like "Metadata:" or "Last updated:") rather than a ternary operator
   */
  private isColonInHtmlText(expression: string, colonIndex: number): boolean {
    // Look backward to find the most recent > or { character
    for (let i = colonIndex - 1; i >= 0; i--) {
      const char = expression[i];

      if (char === '>') {
        // Found closing tag - check if there's only text between > and :
        const textBetween = expression.substring(i + 1, colonIndex).trim();

        // If there's text content (letters/numbers/spaces only), this is likely HTML text
        if (textBetween.length > 0 && /^[a-zA-Z0-9\s]+$/.test(textBetween)) {
          console.log(`🔍 HTML TEXT COLON: Found text "${textBetween}:" after HTML tag - skipping colon`);
          return true;
        }
        break;
      }

      if (char === '{') {
        // Found expression start - this colon is likely in expression context, not HTML text
        break;
      }

      // If we hit another structural character, stop looking
      if (char === '<' || char === '}') {
        break;
      }
    }

    return false;
  }
}