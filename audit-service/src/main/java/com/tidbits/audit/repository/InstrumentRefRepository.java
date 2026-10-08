package com.tidbits.audit.repository;

import com.tidbits.audit.model.entity.InstrumentRef;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InstrumentRefRepository extends JpaRepository<InstrumentRef, Integer> {
}
