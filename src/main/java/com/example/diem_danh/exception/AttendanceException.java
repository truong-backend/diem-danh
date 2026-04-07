package com.example.diem_danh.exception;


import org.springframework.http.HttpStatus;

public class AttendanceException extends RuntimeException {
    private final HttpStatus status;

    public AttendanceException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() { return status; }

    public static AttendanceException notFound(String message) {
        return new AttendanceException(message, HttpStatus.NOT_FOUND);
    }

    public static AttendanceException badRequest(String message) {
        return new AttendanceException(message, HttpStatus.BAD_REQUEST);
    }

    public static AttendanceException forbidden(String message) {
        return new AttendanceException(message, HttpStatus.FORBIDDEN);
    }

    public static AttendanceException conflict(String message) {
        return new AttendanceException(message, HttpStatus.CONFLICT);
    }
}