import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AuditorCommentsView from './AuditorCommentsView';
import '@testing-library/jest-dom';

describe('AuditorCommentsView Component Tests (1.4.1 Functional Testing)', () => {

  it('should render the Auditor Comments View title', () => {
    // 1.4.1 & 1.4.2 Functional & Unit Test
    render(
      <BrowserRouter>
        <AuditorCommentsView />
      </BrowserRouter>
    );
    
    // Assert that the main title exists
    const titleElement = screen.getByText(/Transaction Corrections/i);
    expect(titleElement).toBeInTheDocument();
  });
});
