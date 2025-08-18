package Pfe.T360.controller;


import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import Pfe.T360.dto.ServiceDTO;
import Pfe.T360.entity.Services;
import Pfe.T360.repository.ServiceRepository;
import Pfe.T360.service.ServiceService;

@RestController
@RequestMapping("/api/Services")
@RequiredArgsConstructor
public class ServiceController  {

    private final ServiceService serviceService;
    private final ServiceRepository ServiceRepository;

    @GetMapping
    public List<ServiceDTO> getAllServices() {
        return serviceService.getAllServices();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?>getServiceById(@PathVariable Long id) {
        
        Optional<Services> Service =ServiceRepository.findById(id);
        if (Service.isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", "Service avec l'id " + id + " non trouvé"));
        }
        return ResponseEntity.ok(Service.get());
    }

    @PostMapping
    public ServiceDTO createService(@RequestBody @Valid ServiceDTO dto) {
        return serviceService.createService(dto);
        
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateService(@PathVariable Long id, @RequestBody @Valid ServiceDTO dto) {
    	Optional<Services> Service =ServiceRepository.findById(id);
        if (Service.isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", "Service avec l'id " + id + " non trouvé"));
        }
        return ResponseEntity.ok(serviceService.updateService(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?>  deleteService(@PathVariable Long id) {
    	Optional<Services> Service =ServiceRepository.findById(id);
        if (Service.isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", "Service avec l'id " + id + " non trouvé"));
        }
        
        serviceService.deleteService(id);
        return ResponseEntity.ok(Map.of("message", "Service supprimée avec succès"));
    }
}

