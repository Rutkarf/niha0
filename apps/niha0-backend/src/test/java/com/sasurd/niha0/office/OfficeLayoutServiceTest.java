package com.sasurd.niha0.office;

import com.sasurd.niha0.office.dto.AgentPositionDto;
import com.sasurd.niha0.office.dto.OfficeLayoutDto;
import com.sasurd.niha0.office.dto.RowLayoutDto;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class OfficeLayoutServiceTest {

    private final OfficeLayoutService service = new OfficeLayoutService();

    private static final double CARPET_CENTER_X = 7.2;
    private static final double CARPET_CENTER_Z = 1.2;
    private static final double CARPET_WIDTH = 22;
    private static final double CARPET_DEPTH = 16;
    private static final double CARPET_INSET = 1.0;

    private static final double CARPET_MIN_X = CARPET_CENTER_X - CARPET_WIDTH / 2 + CARPET_INSET;
    private static final double CARPET_MAX_X = CARPET_CENTER_X + CARPET_WIDTH / 2 - CARPET_INSET;
    private static final double CARPET_MIN_Z = CARPET_CENTER_Z - CARPET_DEPTH / 2 + CARPET_INSET;
    private static final double CARPET_MAX_Z = CARPET_CENTER_Z + CARPET_DEPTH / 2 - CARPET_INSET;
    private static final double BACK_WALL_Z = -11;
    private static final double CHIEF_Z = BACK_WALL_Z + 0.12 + 3.0 / 2;

    @Test
    void layoutHas40AgentsAnd10Chiefs() {
        OfficeLayoutDto layout = service.layout();
        assertThat(layout.rowCount()).isEqualTo(10);
        assertThat(layout.agentCount()).isEqualTo(40);
        assertThat(layout.chiefCount()).isEqualTo(10);
        assertThat(layout.rows()).hasSize(10);
    }

    @Test
    void chiefsOnBackWallPlatform() {
        for (RowLayoutDto row : service.rows()) {
            assertThat(row.chief().y()).isEqualTo(2.25);
            assertThat(row.chief().z()).isEqualTo(CHIEF_Z);
            assertThat(row.chief().x()).isBetween(CARPET_MIN_X, CARPET_MAX_X);
            assertThat(row.chief().z()).isLessThan(CARPET_MIN_Z);
        }
    }

    @Test
    void eachTeamFormsStraightColumnAlignedWithChief() {
        for (RowLayoutDto row : service.rows()) {
            double teamX = row.chief().x();
            Set<Double> zValues = new HashSet<>();
            for (AgentPositionDto agent : row.agents()) {
                assertThat(agent.x()).isEqualTo(teamX);
                assertThat(agent.z()).isGreaterThan(row.chief().z());
                zValues.add(agent.z());
            }
            assertThat(zValues).hasSize(4);
        }
    }

    @Test
    void chiefsAlignByRowIndex() {
        List<RowLayoutDto> rows = service.rows();
        assertThat(rows.getFirst().chief().chiefId()).isEqualTo(1);
        assertThat(rows.get(9).chief().chiefId()).isEqualTo(10);
    }

    @Test
    void allGroundAgentsInsideGreenCarpet() {
        for (RowLayoutDto row : service.rows()) {
            for (AgentPositionDto agent : row.agents()) {
                assertThat(agent.x()).isBetween(CARPET_MIN_X, CARPET_MAX_X);
                assertThat(agent.z()).isBetween(CARPET_MIN_Z, CARPET_MAX_Z);
                assertThat(agent.y()).isEqualTo(0);
            }
        }
    }

    @Test
    void chiefsEndpointMatchesRows() {
        assertThat(service.chiefs()).hasSize(10);
        assertThat(service.chiefs().get(0).role()).isEqualTo("Accueil");
        assertThat(service.chiefs().get(0).chiefTitle()).isEqualTo("Responsable Accueil & Réception");
        assertThat(service.rows().get(2).agents().get(0).title()).isEqualTo("Commercial terrain");
    }
}
