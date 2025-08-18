package Pfe.T360.service;


import Pfe.T360.dto.RapportMaterielDTO;
import java.util.List;

public interface RapportService {
	public RapportMaterielDTO genererRapportPourMateriel(Long materielId);
	 public List<RapportMaterielDTO> genererRapportGlobal();
}
