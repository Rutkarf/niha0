package com.sasurd.niha0.office;

import com.sasurd.niha0.office.dto.AgentPositionDto;
import com.sasurd.niha0.office.dto.ChiefConfigDto;
import com.sasurd.niha0.office.dto.ChiefPositionDto;
import com.sasurd.niha0.office.dto.OfficeLayoutDto;
import com.sasurd.niha0.office.dto.RowLayoutDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class OfficeLayoutService {

    private static final String[] ROW_COLORS = {
            "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD",
            "#D4A5A5", "#9B59B6", "#3498DB", "#E67E22", "#2ECC71"
    };

    private static final double CARPET_CENTER_X = 7.2;
    private static final double CARPET_CENTER_Z = 1.2;
    private static final double CARPET_WIDTH = 22;
    private static final double CARPET_DEPTH = 16;
    private static final double CARPET_INSET = 1.0;

    private static final int TEAM_COUNT = 10;
    private static final int DESKS_PER_TEAM = 4;
    private static final double PLATFORM_DEPTH = 3.0;
    private static final double CHIEF_PLATFORM_Y = 2.25;
    private static final double TEAM_SIDE_MARGIN = 1.25;

    private static final double CARPET_MIN_X = CARPET_CENTER_X - CARPET_WIDTH / 2 + CARPET_INSET;
    private static final double CARPET_MAX_X = CARPET_CENTER_X + CARPET_WIDTH / 2 - CARPET_INSET;
    private static final double CARPET_MIN_Z = CARPET_CENTER_Z - CARPET_DEPTH / 2 + CARPET_INSET;
    private static final double CARPET_MAX_Z = CARPET_CENTER_Z + CARPET_DEPTH / 2 - CARPET_INSET;

    private static final double BACK_WALL_Z = -11;
    private static final double WALL_CLEARANCE = 0.12;
    private static final double CHIEF_Z = BACK_WALL_Z + WALL_CLEARANCE + PLATFORM_DEPTH / 2;

    private static final List<Double> TEAM_X = distribute(
            CARPET_MIN_X + TEAM_SIDE_MARGIN,
            CARPET_MAX_X - TEAM_SIDE_MARGIN,
            TEAM_COUNT);
    private static final List<Double> MEMBER_Z = distribute(
            CARPET_MIN_Z + 1.0,
            CARPET_MAX_Z - 1.0,
            DESKS_PER_TEAM);

    public OfficeLayoutDto layout() {
        List<RowLayoutDto> rows = rows();
        int agentCount = rows.stream().mapToInt(r -> r.agents().size()).sum();
        return new OfficeLayoutDto(rows, rows.size(), agentCount, rows.size());
    }

    public List<RowLayoutDto> rows() {
        List<RowLayoutDto> result = new ArrayList<>(TEAM_COUNT);
        for (int rowId = 1; rowId <= TEAM_COUNT; rowId++) {
            result.add(buildTeam(rowId));
        }
        return result;
    }

    public List<ChiefConfigDto> chiefs() {
        return rows().stream()
                .map(row -> new ChiefConfigDto(
                        row.chief().chiefId(),
                        row.rowId(),
                        row.role(),
                        row.chiefTitle(),
                        row.color(),
                        row.chief().x(),
                        row.chief().y(),
                        row.chief().z()))
                .toList();
    }

    private RowLayoutDto buildTeam(int rowId) {
        int i = rowId - 1;
        TeamRoles.TeamDef team = TeamRoles.team(rowId);
        double teamX = TEAM_X.get(i);
        List<AgentPositionDto> agents = new ArrayList<>(DESKS_PER_TEAM);
        for (int col = 0; col < DESKS_PER_TEAM; col++) {
            agents.add(new AgentPositionDto(
                    i * DESKS_PER_TEAM + col + 1,
                    TeamRoles.memberTitle(rowId, col),
                    teamX,
                    0,
                    MEMBER_Z.get(col)));
        }
        ChiefPositionDto chief = new ChiefPositionDto(
                rowId,
                team.chiefTitle(),
                teamX,
                CHIEF_PLATFORM_Y,
                CHIEF_Z);

        return new RowLayoutDto(
                rowId,
                ROW_COLORS[i],
                team.department(),
                team.chiefTitle(),
                List.copyOf(agents),
                chief);
    }

    private static List<Double> distribute(double min, double max, int count) {
        List<Double> values = new ArrayList<>(count);
        if (count <= 0) {
            return values;
        }
        if (count == 1) {
            values.add((min + max) / 2);
            return values;
        }
        double step = (max - min) / (count - 1);
        for (int i = 0; i < count; i++) {
            values.add(min + i * step);
        }
        return values;
    }
}
