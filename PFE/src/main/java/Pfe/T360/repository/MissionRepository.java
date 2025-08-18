package Pfe.T360.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import Pfe.T360.entity.Mission;

public interface MissionRepository extends JpaRepository<Mission, Long>{
	


}
