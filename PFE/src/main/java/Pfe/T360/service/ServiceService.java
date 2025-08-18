package Pfe.T360.service;

import java.util.List;

import Pfe.T360.dto.ServiceDTO;

public interface ServiceService {
    ServiceDTO getServiceById(Long id);
    ServiceDTO createService(ServiceDTO ServiceDTO);
    ServiceDTO updateService(Long id, ServiceDTO ServiceDTO);
    void deleteService(Long id);
	List<ServiceDTO> getAllServices();
	

}
