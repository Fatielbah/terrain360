package Pfe.T360.service.impl;


import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import Pfe.T360.dto.ServiceDTO;
import Pfe.T360.entity.Services;
import Pfe.T360.repository.ServiceRepository;
import Pfe.T360.service.ServiceService;

@Service
@RequiredArgsConstructor
public class ServiceServiceImpl implements ServiceService {
	
	@Autowired
    private final ServiceRepository ServiceRepository;

    private ServiceDTO mapToDTO(Services service) {
        ServiceDTO dto = new ServiceDTO();
        dto.setId(service.getId());
        dto.setNom(service.getNom());
        return dto;
    }

    private Services mapToEntity(ServiceDTO dto) {
        Services Service = new Services();
        Service.setNom(dto.getNom());
        return Service;
    }

    @Override
    public List<ServiceDTO> getAllServices() {
        return ServiceRepository.findAll()
                .stream().map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ServiceDTO getServiceById(Long id) {
        Services Service = ServiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service non trouvée"));
        return mapToDTO(Service);
    }

    @Override
    public ServiceDTO createService(ServiceDTO dto) {
        Services Service = mapToEntity(dto);
        return mapToDTO(ServiceRepository.save(Service));
    }

    @Override
    public ServiceDTO updateService(Long id, ServiceDTO dto) {
        Services Service = ServiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service non trouvée"));

        Service.setNom(dto.getNom());

        return mapToDTO(ServiceRepository.save(Service));
    }

    @Override
    public void deleteService(Long id) {
        ServiceRepository.deleteById(id);
    }
}
