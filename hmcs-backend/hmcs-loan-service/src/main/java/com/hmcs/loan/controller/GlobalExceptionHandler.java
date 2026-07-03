package com.hmcs.loan.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleAllExceptions(Exception ex) {
        ex.printStackTrace();
        return ResponseEntity.badRequest().body("Error: " + ex.getMessage() + "\nCause: " + (ex.getCause() != null ? ex.getCause().getMessage() : "none"));
    }
}
