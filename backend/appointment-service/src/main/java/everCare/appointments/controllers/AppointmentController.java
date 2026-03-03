package everCare.appointments.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @GetMapping("/test")  // → /api/appointments/test
    public String test() {
        return "Appointment Service fonctionne sur le port: " ;
    }

    @GetMapping("/hello")  // → /api/appointments/hello
    public String hello() {
        return "Hello from Appointment Service!";
    }

}
